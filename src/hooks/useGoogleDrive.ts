import { useState, useCallback } from 'react';
import { db } from '@/db/database';
import { useSettings } from './useSettings';
import { toast } from '@/hooks/use-toast';
import { validateBackupFile, MAX_FILE_SIZE_MB } from '@/lib/backupValidation';

const CLIENT_ID = ''; // User needs to add their own Google Cloud Client ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => TokenClient;
        };
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: { discoveryDocs: string[] }) => Promise<void>;
        drive: {
          files: {
            list: (params: { q: string; fields: string; spaces: string }) => Promise<{
              result: { files: Array<{ id: string; name: string; modifiedTime: string }> };
            }>;
            create: (params: {
              resource: { name: string; mimeType: string; parents?: string[] };
              media?: { mimeType: string; body: string };
              fields: string;
            }) => Promise<{ result: { id: string } }>;
            update: (params: {
              fileId: string;
              media: { mimeType: string; body: string };
            }) => Promise<void>;
            get: (params: { fileId: string; alt: string }) => Promise<{ body: string }>;
          };
        };
      };
    };
  }
}

export function useGoogleDrive() {
  const { settings, updateSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [tokenClient, setTokenClient] = useState<TokenClient | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const loadGoogleScripts = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Load GIS (Google Identity Services)
      if (!document.getElementById('google-gis')) {
        const gisScript = document.createElement('script');
        gisScript.id = 'google-gis';
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;
        document.body.appendChild(gisScript);
      }

      // Load GAPI
      if (!document.getElementById('google-gapi')) {
        const gapiScript = document.createElement('script');
        gapiScript.id = 'google-gapi';
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        document.body.appendChild(gapiScript);
      }

      // Wait for both to load
      const checkLoaded = setInterval(() => {
        if (window.google?.accounts?.oauth2 && window.gapi) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkLoaded);
        reject(new Error('Google scripts failed to load'));
      }, 10000);
    });
  }, []);

  const initializeGapi = useCallback(async () => {
    return new Promise<void>((resolve) => {
      window.gapi?.load('client', async () => {
        await window.gapi?.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
        resolve();
      });
    });
  }, []);

  const connect = useCallback(async (clientId: string) => {
    if (!clientId) {
      toast({
        title: "Client ID Required",
        description: "Please enter your Google Cloud Client ID in settings.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await loadGoogleScripts();
      await initializeGapi();

      const client = window.google?.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            toast({
              title: "Connection Failed",
              description: response.error,
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          if (response.access_token) {
            setAccessToken(response.access_token);
            setIsConnected(true);
            toast({
              title: "Connected to Google Drive",
              description: "You can now backup and sync your data.",
            });
          }
          setIsLoading(false);
        },
      });

      setTokenClient(client ?? null);
      client?.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error('Failed to connect:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Google Drive.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [loadGoogleScripts, initializeGapi]);

  const disconnect = useCallback(() => {
    setAccessToken(null);
    setIsConnected(false);
    setTokenClient(null);
    toast({
      title: "Disconnected",
      description: "Google Drive has been disconnected.",
    });
  }, []);

  const backup = useCallback(async () => {
    if (!accessToken || !window.gapi?.client?.drive) {
      toast({
        title: "Not Connected",
        description: "Please connect to Google Drive first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Export all data
      const clients = await db.clients.toArray();
      const settingsData = await db.settings.get('app');
      
      const backupData = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        clients,
        settings: settingsData,
      };

      const content = JSON.stringify(backupData, null, 2);
      const fileName = `keykeep-backup-${new Date().toISOString().split('T')[0]}.json`;

      // Check if backup file already exists
      const existingFiles = await window.gapi.client.drive.files.list({
        q: "name contains 'keykeep-backup' and mimeType='application/json'",
        fields: 'files(id, name, modifiedTime)',
        spaces: 'drive',
      });

      if (existingFiles.result.files.length > 0) {
        // Update existing file
        await window.gapi.client.drive.files.update({
          fileId: existingFiles.result.files[0].id,
          media: {
            mimeType: 'application/json',
            body: content,
          },
        });
      } else {
        // Create new file
        await window.gapi.client.drive.files.create({
          resource: {
            name: fileName,
            mimeType: 'application/json',
          },
          media: {
            mimeType: 'application/json',
            body: content,
          },
          fields: 'id',
        });
      }

      await updateSettings({ lastBackupDate: new Date().toISOString() });

      toast({
        title: "Backup Complete",
        description: "Your data has been saved to Google Drive.",
      });
    } catch (error) {
      console.error('Backup failed:', error);
      toast({
        title: "Backup Failed",
        description: "Could not save data to Google Drive.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, updateSettings]);

  const restore = useCallback(async () => {
    if (!accessToken || !window.gapi?.client?.drive) {
      toast({
        title: "Not Connected",
        description: "Please connect to Google Drive first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find backup file
      const files = await window.gapi.client.drive.files.list({
        q: "name contains 'keykeep-backup' and mimeType='application/json'",
        fields: 'files(id, name, modifiedTime)',
        spaces: 'drive',
      });

      if (files.result.files.length === 0) {
        toast({
          title: "No Backup Found",
          description: "No KeyKeep backup file found in your Google Drive.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get the most recent backup
      const latestFile = files.result.files.sort(
        (a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
      )[0];

      const response = await window.gapi.client.drive.files.get({
        fileId: latestFile.id,
        alt: 'media',
      });

      // Validate the backup data using schema validation
      const validationResult = await validateBackupFile(response.body);
      
      if (!validationResult.success) {
        throw new Error(validationResult.error || 'Invalid backup format');
      }

      const validatedData = validationResult.data!;

      // Clear existing data and restore validated data
      await db.clients.clear();
      if (validatedData.clients.length > 0) {
        await db.clients.bulkPut(validatedData.clients as any[]);
      }

      if (validatedData.settings) {
        await db.settings.put({ ...validatedData.settings, id: 'app' } as any);
      }

      toast({
        title: "Restore Complete",
        description: `Restored ${validatedData.clients.length} clients from backup.`,
      });
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: "Restore Failed",
        description: "Could not restore data from Google Drive.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  return {
    isLoading,
    isConnected,
    connect,
    disconnect,
    backup,
    restore,
  };
}
