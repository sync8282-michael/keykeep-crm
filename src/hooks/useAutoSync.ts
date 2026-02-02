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
const MAX_BACKUP_VERSIONS = 3;

export function useAutoSync() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);
  const hasRestoredRef = useRef(false);
  const lastBackupIdRef = useRef<string | null>(null);

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

  // Cleanup old backups - keep only the newest 3
  const cleanupOldBackups = useCallback(async () => {
    if (!user) return;

    try {
      // Get all backups ordered by created_at desc
      const { data: backups, error: fetchError } = await supabase
        .from('backup_snapshots')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[AutoSync] Error fetching backups for cleanup:', fetchError);
        return;
      }

      if (!backups || backups.length <= MAX_BACKUP_VERSIONS) {
        return; // No cleanup needed
      }

      // Get IDs of backups to delete (all except the newest 3)
      const backupsToDelete = backups.slice(MAX_BACKUP_VERSIONS).map(b => b.id);

      if (backupsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('backup_snapshots')
          .delete()
          .in('id', backupsToDelete);

        if (deleteError) {
          console.error('[AutoSync] Error deleting old backups:', deleteError);
        } else {
          console.log(`[AutoSync] Cleaned up ${backupsToDelete.length} old backup(s)`);
        }
      }
    } catch (error) {
      console.error('[AutoSync] Cleanup error:', error);
    }
  }, [user]);

  // Backup to cloud - uses ref for user to avoid stale closures
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

      const { data, error } = await supabase
        .from('backup_snapshots')
        .insert([{
          user_id: user.id,
          backup_data: JSON.parse(JSON.stringify(backupData)),
          clients_count: clients.length,
          reminders_count: reminders.length,
        }])
        .select('id')
        .single();

      if (error) throw error;

      // Store the ID of this backup to ignore realtime events from self
      if (data) {
        lastBackupIdRef.current = data.id;
      }

      // Update local settings with backup date
      await db.settings.update('app', { lastBackupDate: new Date().toISOString() });

      // Clear pending sync flag
      localStorage.removeItem(SYNC_PENDING_KEY);
      setHasPendingChanges(false);

      // Cleanup old backups after successful backup
      await cleanupOldBackups();

      if (!silent) {
        toast({
          title: "Auto-backup Complete",
          description: `Synced ${clients.length} clients and ${reminders.length} reminders.`,
        });
      }

      console.log('[AutoSync] Backup completed successfully');
      return true;
    } catch (error: any) {
      console.error('[AutoSync] Backup error:', error);
      // Mark as pending for retry
      localStorage.setItem(SYNC_PENDING_KEY, 'true');
      setHasPendingChanges(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, cleanupOldBackups]);

  // Restore from cloud
  const restoreFromCloud = useCallback(async (silent: boolean = false) => {
    if (!user) return false;

    console.log('[AutoSync] Starting restore for user:', user.id);
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
          console.log('[AutoSync] No cloud backup found for user');
          // Still mark as restored to prevent repeated attempts
          localStorage.setItem(LAST_RESTORED_KEY, user.id);
          return false;
        }
        throw error;
      }

      const backupData = data.backup_data as unknown as BackupData;

      if (!backupData.clients) {
        throw new Error('Invalid backup data format');
      }

      console.log('[AutoSync] Restoring data:', {
        clients: backupData.clients.length,
        reminders: backupData.reminders?.length || 0
      });

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

      console.log('[AutoSync] Restore completed successfully');
      return true;
    } catch (error: any) {
      console.error('[AutoSync] Restore error:', error);
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

  // Auto-restore on login - separate effect with proper guards
  useEffect(() => {
    if (!user) {
      hasRestoredRef.current = false;
      return;
    }

    // Prevent multiple restore attempts in the same session
    if (hasRestoredRef.current) {
      return;
    }

    const lastRestoredUser = localStorage.getItem(LAST_RESTORED_KEY);
    
    // Only restore if this is a new login (different user or first time on this device)
    if (lastRestoredUser !== user.id) {
      console.log('[AutoSync] New login detected, restoring from cloud...');
      hasRestoredRef.current = true;
      restoreFromCloud(false);
    } else if (localStorage.getItem(SYNC_PENDING_KEY) === 'true' && navigator.onLine) {
      // If same user and has pending changes, sync them
      console.log('[AutoSync] Same user with pending changes, backing up...');
      hasRestoredRef.current = true;
      backupToCloud(true);
    } else {
      hasRestoredRef.current = true;
    }
  }, [user?.id]); // Only depend on user.id to prevent re-runs

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Subscribe to realtime backup changes for cross-device sync
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('backup_snapshots_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'backup_snapshots',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Ignore backups we just created
          if (payload.new && (payload.new as any).id === lastBackupIdRef.current) {
            console.log('[AutoSync] Ignoring own backup event');
            return;
          }

          // Another device created a backup - restore from it
          console.log('[AutoSync] New backup detected from another device, restoring...');
          restoreFromCloud(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, restoreFromCloud]);

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
