import { useState, useEffect, useMemo } from "react";
import { addDays, parseISO, format, differenceInDays, isToday } from "date-fns";
import { Users, Home, Bell, CalendarCheck, Plus, FileDown, FileUp, Calendar } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ReminderCard } from "@/components/dashboard/ReminderCard";
import { ClientCard } from "@/components/clients/ClientCard";
import { ReminderForm, ReminderFormData } from "@/components/forms/ReminderForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client, Property, Reminder } from "@/types";
import {
  getClients,
  getProperties,
  getReminders,
  saveReminders,
  generateId,
} from "@/lib/store";

export default function Index() {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderForm, setShowReminderForm] = useState(false);

  useEffect(() => {
    setClients(getClients());
    setProperties(getProperties());
    setReminders(getReminders());
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    const upcomingReminders = reminders.filter((r) => {
      if (r.isCompleted) return false;
      const reminderDate = parseISO(r.reminderDate);
      const daysUntil = differenceInDays(reminderDate, today);
      return daysUntil >= 0 && daysUntil <= 30;
    });

    const todayReminders = reminders.filter((r) => {
      if (r.isCompleted) return false;
      return isToday(parseISO(r.reminderDate));
    });

    return {
      totalClients: clients.length,
      totalProperties: properties.length,
      upcomingReminders: upcomingReminders.length,
      todayReminders: todayReminders.length,
    };
  }, [clients, properties, reminders]);

  const sortedReminders = useMemo(() => {
    return [...reminders]
      .filter((r) => !r.isCompleted)
      .sort((a, b) => {
        const dateA = parseISO(a.reminderDate);
        const dateB = parseISO(b.reminderDate);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10);
  }, [reminders]);

  const handleCreateReminder = (data: ReminderFormData) => {
    const reminderDate = data.specificDate
      ? data.specificDate
      : data.daysAfter
      ? addDays(data.baseDate, data.daysAfter)
      : data.baseDate;

    const newReminder: Reminder = {
      id: generateId(),
      clientId: data.clientId,
      propertyId: data.propertyId,
      type: data.type,
      title: data.title,
      description: data.description,
      baseDate: format(data.baseDate, "yyyy-MM-dd"),
      reminderDate: format(reminderDate, "yyyy-MM-dd"),
      channel: data.channel,
      isRecurring: data.isRecurring,
      isCompleted: false,
      createdAt: format(new Date(), "yyyy-MM-dd"),
    };

    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
    setShowReminderForm(false);
  };

  const handleCompleteReminder = (id: string) => {
    const updatedReminders = reminders.map((r) =>
      r.id === id ? { ...r, isCompleted: true } : r
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const getClientById = (id: string) => clients.find((c) => c.id === id);
  const getPropertyById = (id: string) => properties.find((p) => p.id === id);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Track clients, properties, and never miss an important date.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Clients"
            value={stats.totalClients}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title="Properties"
            value={stats.totalProperties}
            icon={Home}
            variant="default"
          />
          <StatsCard
            title="Upcoming (30 days)"
            value={stats.upcomingReminders}
            icon={Bell}
            variant="warning"
          />
          <StatsCard
            title="Today"
            value={stats.todayReminders}
            icon={CalendarCheck}
            variant="success"
          />
        </div>

        {/* Reminders Section */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Reminders</h2>
                <p className="text-sm text-muted-foreground">
                  Track purchases and celebrate ownership anniversaries.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowReminderForm(!showReminderForm)}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Reminder
                </Button>
                <Button variant="outline" size="sm">
                  <FileDown className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm">
                  <FileUp className="w-4 h-4 mr-1" />
                  Import CSV
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  Open Calendar
                </Button>
              </div>
            </div>
          </div>

          {/* Reminder Form */}
          {showReminderForm && (
            <div className="p-6 border-b border-border bg-muted/30">
              <ReminderForm
                clients={clients}
                properties={properties}
                onSubmit={handleCreateReminder}
                onCancel={() => setShowReminderForm(false)}
              />
            </div>
          )}

          {/* Reminders List */}
          <div className="p-6">
            {sortedReminders.length > 0 ? (
              <div className="grid gap-3">
                {sortedReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    client={getClientById(reminder.clientId)}
                    property={reminder.propertyId ? getPropertyById(reminder.propertyId) : undefined}
                    onComplete={handleCompleteReminder}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No pending reminders</h3>
                <p className="text-muted-foreground">
                  Create a reminder to get started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Clients */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Clients</h2>
              <Button variant="outline" size="sm" asChild>
                <a href="/clients">View All</a>
              </Button>
            </div>
          </div>
          <div className="p-6">
            {clients.length > 0 ? (
              <div className="grid gap-3">
                {clients.slice(0, 5).map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    properties={properties.filter((p) => p.clientId === client.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No clients yet</h3>
                <p className="text-muted-foreground">
                  Add your first client to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
