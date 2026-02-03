import { db, Client } from '@/db/database';
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { validateBackupFile, MAX_FILE_SIZE_MB } from '@/lib/backupValidation';

interface BackupData {
  version: number;
  exportedAt: string;
  clients: Client[];
}

export function useBackup() {
  const exportData = useCallback(async () => {
    try {
      const clients = await db.clients.toArray();
      
      const backup: BackupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        clients,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keykeep_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Update last backup date
      await db.settings.update('app', { lastBackupDate: new Date().toISOString() });

      toast({
        title: "Export Complete",
        description: `Exported ${clients.length} clients successfully.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export data. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const importData = useCallback(async (file: File) => {
    try {
      // Validate file size first
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `Maximum file size is ${MAX_FILE_SIZE_MB}MB.`,
          variant: "destructive",
        });
        return false;
      }

      // Validate backup file using schema validation
      const validationResult = await validateBackupFile(file);

      if (!validationResult.success) {
        toast({
          title: "Invalid Backup",
          description: validationResult.error || "Could not read backup file.",
          variant: "destructive",
        });
        return false;
      }

      const data = validationResult.data!;

      // Clear existing data and import validated data
      await db.clients.clear();
      if (data.clients.length > 0) {
        // Cast validated data to Client type - validation ensures structure is compatible
        await db.clients.bulkAdd(data.clients as unknown as Client[]);
      }

      toast({
        title: "Import Complete",
        description: `Imported ${data.clients.length} clients successfully.`,
      });

      return true;
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Could not read backup file. Make sure it's a valid KeyKeep backup.",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      await db.clients.clear();
      
      toast({
        title: "Data Cleared",
        description: "All client data has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not clear data.",
        variant: "destructive",
      });
    }
  }, []);

  return { exportData, importData, clearAllData };
}