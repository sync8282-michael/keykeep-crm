import { useLiveQuery } from 'dexie-react-hooks';
import { db, AppSettings } from '@/db/database';
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export function useSettings() {
  const settings = useLiveQuery(() => db.settings.get('app'));

  const updateSettings = useCallback(async (data: Partial<AppSettings>) => {
    await db.settings.update('app', data);
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
    });
  }, []);

  return { settings, updateSettings };
}

export function useGoogleMapsApiKey() {
  const settings = useLiveQuery(() => db.settings.get('app'));
  return settings?.googleMapsApiKey;
}
