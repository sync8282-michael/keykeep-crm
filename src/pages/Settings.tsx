import { useState } from "react";
import { Settings as SettingsIcon, Database, Bell, Mail, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [reminderDays, setReminderDays] = useState("7");

  const handleClearData = () => {
    localStorage.clear();
    toast({
      title: "Data Cleared",
      description: "All data has been reset to defaults. Refresh the page to see changes.",
    });
  };

  const handleExportData = () => {
    const data = {
      clients: localStorage.getItem("keykeep_clients"),
      properties: localStorage.getItem("keykeep_properties"),
      reminders: localStorage.getItem("keykeep_reminders"),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keykeep-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your data has been exported successfully.",
    });
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

        {/* Notification Settings */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="text-base">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminder notifications via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notifications" className="text-base">
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminder notifications via SMS
                </p>
              </div>
              <Switch
                id="sms-notifications"
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-days">Advance Reminder (days)</Label>
              <Input
                id="reminder-days"
                type="number"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="max-w-[120px]"
              />
              <p className="text-sm text-muted-foreground">
                How many days before an event to send a reminder
              </p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Management
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Export Data</p>
                <p className="text-sm text-muted-foreground">
                  Download all your data as a JSON file
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div>
                <p className="font-medium text-destructive">Clear All Data</p>
                <p className="text-sm text-muted-foreground">
                  This will reset all clients, properties, and reminders
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
                      your clients, properties, and reminders and reset the app to its
                      default state.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData}>
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
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              A real estate client management system for tracking clients, properties, 
              and important dates. Built for internal use by real estate agencies.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
