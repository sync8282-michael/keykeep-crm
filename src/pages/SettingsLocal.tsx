import { useState, useRef, useEffect } from "react";
import { Settings as SettingsIcon, Database, Key, Trash2, Eye, EyeOff, CheckCircle2, Download, Upload, Moon, Sun, Monitor, Cloud, CloudOff, Bell, RefreshCw, LogOut } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import { useBackup } from "@/hooks/useBackup";
import { useCloudBackup } from "@/hooks/useCloudBackup";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/auth/AuthProvider";
import { format, parseISO } from "date-fns";

export default function SettingsLocal() {
  const { settings, updateSettings } = useSettings();
  const { exportData, importData, clearAllData } = useBackup();
  const { isLoading: isCloudLoading, lastBackup, fetchLastBackup, backupToCloud, restoreFromCloud, deleteCloudBackups } = useCloudBackup();
  const { isSupported: notificationsSupported, isEnabled: notificationsEnabled, requestPermission } = usePushNotifications();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [googleApiKey, setGoogleApiKey] = useState("");
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [isGoogleKeySaved, setIsGoogleKeySaved] = useState(false);

  const [resendApiKey, setResendApiKey] = useState("");
  const [showResendKey, setShowResendKey] = useState(false);
  const [isResendKeySaved, setIsResendKeySaved] = useState(false);

  // Fetch last backup on mount
  useEffect(() => {
    fetchLastBackup();
  }, [fetchLastBackup]);

  useEffect(() => {
    if (settings?.googleMapsApiKey) {
      setGoogleApiKey(settings.googleMapsApiKey);
      setIsGoogleKeySaved(true);
    }
    if (settings?.resendApiKey) {
      setResendApiKey(settings.resendApiKey);
      setIsResendKeySaved(true);
    }
  }, [settings]);

  const handleSaveGoogleKey = async () => {
    await updateSettings({ googleMapsApiKey: googleApiKey.trim() || undefined });
    setIsGoogleKeySaved(true);
  };

  const handleSaveResendKey = async () => {
    await updateSettings({ resendApiKey: resendApiKey.trim() || undefined });
    setIsResendKeySaved(true);
  };

  const handleRemoveGoogleKey = async () => {
    await updateSettings({ googleMapsApiKey: undefined });
    setGoogleApiKey("");
    setIsGoogleKeySaved(false);
  };

  const handleRemoveResendKey = async () => {
    await updateSettings({ resendApiKey: undefined });
    setResendApiKey("");
    setIsResendKeySaved(false);
  };

  const handleThemeChange = async (value: 'light' | 'dark' | 'system') => {
    await updateSettings({ theme: value });
    
    // Apply theme immediately
    if (value === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (value === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importData(file);
      e.target.value = "";
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Configure your KeyKeep preferences.
          </p>
        </div>

        {/* Account */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Account
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Signed in as</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sun className="w-5 h-5" />
              Appearance
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings?.theme || "system"}
                onValueChange={(v) => handleThemeChange(v as 'light' | 'dark' | 'system')}
              >
                <SelectTrigger className="w-full max-w-[200px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" /> Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4" /> Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" /> System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Google Maps API Key */}
            <div className="space-y-2">
              <Label htmlFor="google-api-key">Google Maps API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="google-api-key"
                    type={showGoogleKey ? "text" : "password"}
                    value={googleApiKey}
                    onChange={(e) => {
                      setGoogleApiKey(e.target.value);
                      setIsGoogleKeySaved(false);
                    }}
                    placeholder="AIzaSy..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowGoogleKey(!showGoogleKey)}
                  >
                    {showGoogleKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button onClick={handleSaveGoogleKey} disabled={isGoogleKeySaved || !googleApiKey.trim()}>
                  {isGoogleKeySaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Required for fetching Street View images. Get your key from{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>

            {isGoogleKeySaved && googleApiKey && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Remove Google API Key</p>
                  <p className="text-sm text-muted-foreground">
                    This will disable Street View fetching
                  </p>
                </div>
                <Button variant="outline" onClick={handleRemoveGoogleKey}>
                  Remove
                </Button>
              </div>
            )}

            {/* Resend API Key */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Label htmlFor="resend-api-key">Resend API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="resend-api-key"
                    type={showResendKey ? "text" : "password"}
                    value={resendApiKey}
                    onChange={(e) => {
                      setResendApiKey(e.target.value);
                      setIsResendKeySaved(false);
                    }}
                    placeholder="re_..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowResendKey(!showResendKey)}
                  >
                    {showResendKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button onClick={handleSaveResendKey} disabled={isResendKeySaved || !resendApiKey.trim()}>
                  {isResendKeySaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Required for sending anniversary emails. Get your key from{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Resend Dashboard
                </a>
              </p>
            </div>

            {isResendKeySaved && resendApiKey && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Remove Resend API Key</p>
                  <p className="text-sm text-muted-foreground">
                    This will disable email sending
                  </p>
                </div>
                <Button variant="outline" onClick={handleRemoveResendKey}>
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Push Notifications
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">
                  {notificationsEnabled ? "Notifications Enabled" : "Enable Notifications"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {notificationsSupported 
                    ? "Get reminded about upcoming anniversaries" 
                    : "Not supported in this browser"}
                </p>
              </div>
              <Button 
                variant={notificationsEnabled ? "outline" : "default"}
                onClick={requestPermission}
                disabled={!notificationsSupported || notificationsEnabled}
              >
                {notificationsEnabled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Enabled
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Enable
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Cloud Backup */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Cloud Backup
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-green-500" />
                  Cloud Connected
                </p>
                <p className="text-sm text-muted-foreground">
                  Backup your data to the cloud for safe keeping
                </p>
              </div>
            </div>

            {/* Last Backup Info */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Last Cloud Backup</p>
                <p className="text-sm text-muted-foreground">
                  {lastBackup 
                    ? `${format(parseISO(lastBackup.created_at), "PPP 'at' p")} — ${lastBackup.clients_count} clients, ${lastBackup.reminders_count} reminders`
                    : "No cloud backups yet"}
                </p>
              </div>
            </div>

            {/* Backup Button */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Backup to Cloud</p>
                <p className="text-sm text-muted-foreground">
                  Save all your local data to the cloud
                </p>
              </div>
              <Button variant="outline" onClick={backupToCloud} disabled={isCloudLoading}>
                {isCloudLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Backup
              </Button>
            </div>

            {/* Restore Button */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Restore from Cloud</p>
                <p className="text-sm text-muted-foreground">
                  Replace local data with your latest cloud backup
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isCloudLoading || !lastBackup}>
                    {isCloudLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Restore
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restore from Cloud?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will replace all your current local data with the latest cloud backup. 
                      Any changes made since the last backup will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={restoreFromCloud}>
                      Yes, restore data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Delete Cloud Backups */}
            {lastBackup && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div>
                  <p className="font-medium text-destructive">Delete Cloud Backups</p>
                  <p className="text-sm text-muted-foreground">
                    Remove all your backups from the cloud
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isCloudLoading}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete all cloud backups?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your cloud backups. Your local data will not be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteCloudBackups}>
                        Yes, delete backups
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>

        {/* Local Backup */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Database className="w-5 h-5" />
              Local Backup
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Last Local Backup</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.lastBackupDate 
                    ? format(parseISO(settings.lastBackupDate), "PPP 'at' p")
                    : "Never backed up locally"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Export Data</p>
                <p className="text-sm text-muted-foreground">
                  Download all your data as a JSON file
                </p>
              </div>
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Import Data</p>
                <p className="text-sm text-muted-foreground">
                  Restore data from a backup file
                </p>
              </div>
              <Button variant="outline" onClick={handleImportClick}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div>
                <p className="font-medium text-destructive">Clear All Data</p>
                <p className="text-sm text-muted-foreground">
                  This will remove all clients permanently
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all
                      your clients and reset the app to its default state.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearAllData}>
                      Yes, clear all data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card-elevated">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">KeyKeep</h2>
                <p className="text-sm text-muted-foreground">Version 2.1.0 — Offline-First with Cloud Backup</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              A commercial-grade client anniversary tracker for real estate agents. 
              Your data is stored locally and works offline — cloud backup keeps it safe.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
