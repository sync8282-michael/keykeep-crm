import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { db, Client, Reminder } from '@/db/database';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/AuthProvider';
import { validateBackupFile, ValidatedBackupData } from '@/lib/backupValidation';

interface BackupData {
  version: number;
  exportedAt: string;
  clients: Client[];
  reminders: Reminder[];
}

interface BackupSnapshot {
  id: string;
  created_at: string;
  clients_count: number;
  reminders_count: number;
}

export function useCloudBackup() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<BackupSnapshot | null>(null);

  // Fetch the latest backup info
  const fetchLastBackup = useCallback(async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('backup_snapshots')
        .select('id, created_at, clients_count, reminders_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching backup:', error);
        return null;
      }

      setLastBackup(data);
      return data;
    } catch (error) {
      console.error('Error fetching backup:', error);
      return null;
    }
  }, [user]);

  // Backup local data to Supabase
  const backupToCloud = useCallback(async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to backup to cloud.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      const clients = await db.clients.toArray();
      const reminders = await db.reminders.toArray();

      const backupData: BackupData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        clients,
        reminders,
      };

      const { error } = await supabase
        .from('backup_snapshots')
        .insert([{
          user_id: user.id,
          backup_data: JSON.parse(JSON.stringify(backupData)),
          clients_count: clients.length,
          reminders_count: reminders.length,
        }]);

      if (error) throw error;

      // Update local settings with backup date
      await db.settings.update('app', { lastBackupDate: new Date().toISOString() });

      // Refresh last backup info
      await fetchLastBackup();

      toast({
        title: "Backup Complete",
        description: `Backed up ${clients.length} clients and ${reminders.length} reminders to cloud.`,
      });

      return true;
    } catch (error: any) {
      console.error('Backup error:', error);
      toast({
        title: "Backup Failed",
        description: error?.message || "Could not backup to cloud. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchLastBackup]);

  // Restore from the latest cloud backup
  const restoreFromCloud = useCallback(async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to restore from cloud.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('backup_snapshots')
        .select('backup_data, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "No Backup Found",
            description: "You don't have any cloud backups yet.",
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      // Validate the backup data from cloud
      const validationResult = await validateBackupFile(data.backup_data);
      
      if (!validationResult.success) {
        throw new Error(validationResult.error || 'Invalid backup data format');
      }

      const validatedData = validationResult.data!;

      // Clear existing local data and restore from validated backup
      await db.clients.clear();
      await db.reminders.clear();

      if (validatedData.clients.length > 0) {
        await db.clients.bulkAdd(validatedData.clients as unknown as Client[]);
      }

      if (validatedData.reminders && validatedData.reminders.length > 0) {
        await db.reminders.bulkAdd(validatedData.reminders as unknown as Reminder[]);
      }

      toast({
        title: "Restore Complete",
        description: `Restored ${validatedData.clients.length} clients and ${validatedData.reminders?.length || 0} reminders from cloud.`,
      });

      return true;
    } catch (error: any) {
      console.error('Restore error:', error);
      toast({
        title: "Restore Failed",
        description: error?.message || "Could not restore from cloud. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Delete all cloud backups
  const deleteCloudBackups = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('backup_snapshots')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setLastBackup(null);

      toast({
        title: "Backups Deleted",
        description: "All cloud backups have been removed.",
      });

      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error?.message || "Could not delete backups.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isLoading,
    lastBackup,
    fetchLastBackup,
    backupToCloud,
    restoreFromCloud,
    deleteCloudBackups,
  };
}
