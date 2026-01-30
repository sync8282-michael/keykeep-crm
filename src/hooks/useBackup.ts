import { db, Client } from '@/db/database';
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

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
      const text = await file.text();
      const data: BackupData = JSON.parse(text);

      if (!data.version || !data.clients) {
        throw new Error('Invalid backup file format');
      }

      // Clear existing data and import new
      await db.clients.clear();
      await db.clients.bulkAdd(data.clients);

      toast({
        title: "Import Complete",
        description: `Imported ${data.clients.length} clients successfully.`,
      });

      return true;
    } catch (error) {
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
