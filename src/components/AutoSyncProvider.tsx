import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAutoSync, setGlobalTriggerSync } from '@/hooks/useAutoSync';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

interface AutoSyncContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  hasPendingChanges: boolean;
  triggerSync: () => void;
  backupToCloud: (silent?: boolean) => Promise<boolean>;
  restoreFromCloud: (silent?: boolean) => Promise<boolean>;
}

const AutoSyncContext = createContext<AutoSyncContextValue | undefined>(undefined);

export function AutoSyncProvider({ children }: { children: ReactNode }) {
  const syncState = useAutoSync();

  // Register the global trigger for use in mutation hooks
  useEffect(() => {
    setGlobalTriggerSync(syncState.triggerSync);
  }, [syncState.triggerSync]);

  return (
    <AutoSyncContext.Provider value={syncState}>
      {children}
    </AutoSyncContext.Provider>
  );
}

export function useAutoSyncContext() {
  const ctx = useContext(AutoSyncContext);
  if (!ctx) {
    throw new Error('useAutoSyncContext must be used within AutoSyncProvider');
  }
  return ctx;
}

// Optional: Sync status indicator component
export function SyncStatusIndicator() {
  const { isOnline, isSyncing, hasPendingChanges } = useAutoSyncContext();

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
        <CloudOff className="h-3 w-3" />
        <span>Offline</span>
      </div>
    );
  }

  if (hasPendingChanges) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
        <Cloud className="h-3 w-3" />
        <span>Pending sync</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Cloud className="h-3 w-3" />
      <span>Synced</span>
    </div>
  );
}
