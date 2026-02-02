import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/db/database';
import { useAuth } from '@/auth/AuthProvider';

interface StorageUsage {
  localBytes: number;
  cloudBytes: number;
  totalBytes: number;
  maxBytes: number;
  clientsCount: number;
  remindersCount: number;
  backupsCount: number;
  isLoading: boolean;
}

// Cloud storage limit per user (3.5GB)
const MAX_CLOUD_STORAGE_BYTES = 3.5 * 1024 * 1024 * 1024; // 3.5GB

// Helper to estimate JSON size in bytes
function getJsonSize(obj: unknown): number {
  const str = JSON.stringify(obj);
  // UTF-8 encoding: most chars are 1 byte, some are 2-4
  return new Blob([str]).size;
}

export function useStorageUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<StorageUsage>({
    localBytes: 0,
    cloudBytes: 0,
    totalBytes: 0,
    maxBytes: MAX_CLOUD_STORAGE_BYTES,
    clientsCount: 0,
    remindersCount: 0,
    backupsCount: 0,
    isLoading: true,
  });

  const calculateUsage = useCallback(async () => {
    setUsage(prev => ({ ...prev, isLoading: true }));

    try {
      // Get local data
      const clients = await db.clients.toArray();
      const reminders = await db.reminders.toArray();
      
      const localBytes = getJsonSize({ clients, reminders });

      // Get cloud backup sizes if user is logged in
      let cloudBytes = 0;
      let backupsCount = 0;

      if (user) {
        const { data: backups, error } = await supabase
          .from('backup_snapshots')
          .select('backup_data, id')
          .eq('user_id', user.id);

        if (!error && backups) {
          backupsCount = backups.length;
          // Sum up all backup sizes
          cloudBytes = backups.reduce((total, backup) => {
            return total + getJsonSize(backup.backup_data);
          }, 0);
        }
      }

      setUsage({
        localBytes,
        cloudBytes,
        totalBytes: cloudBytes, // Cloud is what we track for quota
        maxBytes: MAX_CLOUD_STORAGE_BYTES,
        clientsCount: clients.length,
        remindersCount: reminders.length,
        backupsCount,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      setUsage(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    calculateUsage();
  }, [calculateUsage]);

  const refresh = useCallback(() => {
    calculateUsage();
  }, [calculateUsage]);

  return { ...usage, refresh };
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Get percentage used
export function getUsagePercentage(used: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}
