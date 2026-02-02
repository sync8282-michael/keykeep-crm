import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { db, Client, Reminder } from '@/db/database';
import { useAuth } from '@/auth/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface BackupData {
  version: number;
  exportedAt: string;
  clients: Client[];
  reminders: Reminder[];
}

const SYNC_DEBOUNCE_MS = 3000; // 3 seconds debounce
const SYNC_PENDING_KEY = 'keykeep_sync_pending';
const LAST_RESTORED_KEY = 'keykeep_last_restored_user';

export function useAutoSync() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, trigger sync if there are pending changes
      if (localStorage.getItem(SYNC_PENDING_KEY) === 'true') {
        triggerSync();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending changes on mount
    setHasPendingChanges(localStorage.getItem(SYNC_PENDING_KEY) === 'true');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Backup to cloud
  const backupToCloud = useCallback(async (silent: boolean = true) => {
    if (!user) return false;
    if (isRestoringRef.current) return false; // Don't backup while restoring

    setIsSyncing(true);
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

      // Clear pending sync flag
      localStorage.removeItem(SYNC_PENDING_KEY);
      setHasPendingChanges(false);

      if (!silent) {
        toast({
          title: "Auto-backup Complete",
          description: `Synced ${clients.length} clients and ${reminders.length} reminders.`,
        });
      }

      return true;
    } catch (error: any) {
      console.error('Auto-backup error:', error);
      // Mark as pending for retry
      localStorage.setItem(SYNC_PENDING_KEY, 'true');
      setHasPendingChanges(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Restore from cloud
  const restoreFromCloud = useCallback(async (silent: boolean = false) => {
    if (!user) return false;

    isRestoringRef.current = true;
    setIsSyncing(true);
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
          // No backup found - this is fine for new users
          console.log('No cloud backup found for user');
          return false;
        }
        throw error;
      }

      const backupData = data.backup_data as unknown as BackupData;

      if (!backupData.clients) {
        throw new Error('Invalid backup data format');
      }

      // Clear existing local data and restore from backup
      await db.clients.clear();
      await db.reminders.clear();

      if (backupData.clients.length > 0) {
        await db.clients.bulkAdd(backupData.clients);
      }

      if (backupData.reminders && backupData.reminders.length > 0) {
        await db.reminders.bulkAdd(backupData.reminders);
      }

      // Mark this user as restored
      localStorage.setItem(LAST_RESTORED_KEY, user.id);
      // Clear any pending sync flag since we just restored
      localStorage.removeItem(SYNC_PENDING_KEY);
      setHasPendingChanges(false);

      if (!silent) {
        toast({
          title: "Data Restored",
          description: `Loaded ${backupData.clients.length} clients and ${backupData.reminders?.length || 0} reminders from cloud.`,
        });
      }

      return true;
    } catch (error: any) {
      console.error('Auto-restore error:', error);
      if (!silent) {
        toast({
          title: "Restore Failed",
          description: "Could not restore data from cloud.",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      isRestoringRef.current = false;
      setIsSyncing(false);
    }
  }, [user]);

  // Debounced sync trigger
  const triggerSync = useCallback(() => {
    if (!user) {
      // Mark as pending for when user logs in
      localStorage.setItem(SYNC_PENDING_KEY, 'true');
      setHasPendingChanges(true);
      return;
    }

    if (!navigator.onLine) {
      // Offline - mark for later sync
      localStorage.setItem(SYNC_PENDING_KEY, 'true');
      setHasPendingChanges(true);
      return;
    }

    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Mark as pending immediately
    localStorage.setItem(SYNC_PENDING_KEY, 'true');
    setHasPendingChanges(true);

    // Debounce the actual sync
    syncTimeoutRef.current = setTimeout(() => {
      backupToCloud(true);
    }, SYNC_DEBOUNCE_MS);
  }, [user, backupToCloud]);

  // Auto-restore on login
  useEffect(() => {
    if (!user) return;

    const lastRestoredUser = localStorage.getItem(LAST_RESTORED_KEY);
    
    // Only restore if this is a new login (different user or first time)
    if (lastRestoredUser !== user.id) {
      restoreFromCloud(false);
    } else if (localStorage.getItem(SYNC_PENDING_KEY) === 'true' && navigator.onLine) {
      // If same user and has pending changes, sync them
      backupToCloud(true);
    }
  }, [user, restoreFromCloud, backupToCloud]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOnline,
    isSyncing,
    hasPendingChanges,
    triggerSync,
    backupToCloud,
    restoreFromCloud,
  };
}

// Create a singleton context for the sync trigger
let globalTriggerSync: (() => void) | null = null;

export function setGlobalTriggerSync(fn: () => void) {
  globalTriggerSync = fn;
}

export function triggerAutoSync() {
  if (globalTriggerSync) {
    globalTriggerSync();
  }
}
