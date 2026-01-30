import { useMemo } from "react";
import { addDays, format } from "date-fns";
import { Users, Home, Bell, CalendarCheck, Plus, Calendar } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ReminderCard } from "@/components/dashboard/ReminderCard";
import { ClientCard } from "@/components/clients/ClientCard";
import { ReminderForm, ReminderFormData } from "@/components/forms/ReminderForm";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/skeletons/PageSkeletons";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useCreateReminder, useCompleteReminder } from "@/hooks/useReminders";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Index() {
  const [showReminderForm, setShowReminderForm] = useState(false);
  const {
    stats,
    sortedReminders,
    recentClients,
    clients,
    properties,
    isLoading,
  } = useDashboardStats();

  const createReminder = useCreateReminder();
  const completeReminder = useCompleteReminder();

  const handleCreateReminder = async (data: ReminderFormData) => {
    const reminderDate = data.specificDate
      ? data.specificDate
      : data.daysAfter
      ? addDays(data.baseDate, data.daysAfter)
      : data.baseDate;

    await createReminder.mutateAsync({
      client_id: data.clientId,
      property_id: data.propertyId || null,
      type: data.type as "anniversary" | "birthday" | "followup" | "custom",
      title: data.title,
      description: data.description || null,
      base_date: format(data.baseDate, "yyyy-MM-dd"),
      reminder_date: format(reminderDate, "yyyy-MM-dd"),
      channel: data.channel as "email" | "sms" | "both",
      is_recurring: data.isRecurring,
    });

    setShowReminderForm(false);
  };

  const handleCompleteReminder = (id: string) => {
    completeReminder.mutate(id);
  };

  const getClientById = (id: string) => clients.find((c) => c.id === id);
  const getPropertyById = (id: string) => properties.find((p) => p.id === id);

  if (isLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

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
                  disabled={clients.length === 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Reminder
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/calendar">
                    <Calendar className="w-4 h-4 mr-1" />
                    Calendar
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Reminder Form */}
          {showReminderForm && clients.length > 0 && (
            <div className="p-6 border-b border-border bg-muted/30">
              <ReminderForm
                clients={clients.map((c) => ({
                  id: c.id,
                  name: c.name,
                  email: c.email || "",
                  phone: c.phone || "",
                  birthday: c.birthday || undefined,
                  notes: c.notes || undefined,
                  createdAt: c.created_at,
                }))}
                properties={properties.map((p) => ({
                  id: p.id,
                  clientId: p.client_id,
                  type: p.type,
                  address: p.address,
                  purchaseDate: p.purchase_date || undefined,
                  purchasePrice: p.purchase_price || undefined,
                  notes: p.notes || undefined,
                  createdAt: p.created_at,
                }))}
                onSubmit={handleCreateReminder}
                onCancel={() => setShowReminderForm(false)}
              />
            </div>
          )}

          {/* Reminders List */}
          <div className="p-6">
            {sortedReminders.length > 0 ? (
              <div className="grid gap-3">
                {sortedReminders.map((reminder) => {
                  const client = getClientById(reminder.client_id);
                  const property = reminder.property_id
                    ? getPropertyById(reminder.property_id)
                    : undefined;

                  return (
                    <ReminderCard
                      key={reminder.id}
                      reminder={{
                        id: reminder.id,
                        clientId: reminder.client_id,
                        propertyId: reminder.property_id || undefined,
                        type: reminder.type,
                        title: reminder.title,
                        description: reminder.description || undefined,
                        baseDate: reminder.base_date,
                        reminderDate: reminder.reminder_date,
                        channel: reminder.channel,
                        isRecurring: reminder.is_recurring,
                        isCompleted: reminder.is_completed,
                        createdAt: reminder.created_at,
                      }}
                      client={
                        client
                          ? {
                              id: client.id,
                              name: client.name,
                              email: client.email || "",
                              phone: client.phone || "",
                              birthday: client.birthday || undefined,
                              notes: client.notes || undefined,
                              createdAt: client.created_at,
                            }
                          : undefined
                      }
                      property={
                        property
                          ? {
                              id: property.id,
                              clientId: property.client_id,
                              type: property.type,
                              address: property.address,
                              purchaseDate: property.purchase_date || undefined,
                              purchasePrice: property.purchase_price || undefined,
                              notes: property.notes || undefined,
                              createdAt: property.created_at,
                            }
                          : undefined
                      }
                      onComplete={handleCompleteReminder}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No pending reminders</h3>
                <p className="text-muted-foreground">
                  {clients.length === 0
                    ? "Add a client first to create reminders."
                    : "Create a reminder to get started."}
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
                <Link to="/clients">View All</Link>
              </Button>
            </div>
          </div>
          <div className="p-6">
            {recentClients.length > 0 ? (
              <div className="grid gap-3">
                {recentClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={{
                      id: client.id,
                      name: client.name,
                      email: client.email || "",
                      phone: client.phone || "",
                      birthday: client.birthday || undefined,
                      notes: client.notes || undefined,
                      createdAt: client.created_at,
                    }}
                    properties={properties
                      .filter((p) => p.client_id === client.id)
                      .map((p) => ({
                        id: p.id,
                        clientId: p.client_id,
                        type: p.type,
                        address: p.address,
                        purchaseDate: p.purchase_date || undefined,
                        purchasePrice: p.purchase_price || undefined,
                        notes: p.notes || undefined,
                        createdAt: p.created_at,
                      }))}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No clients yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first client to get started.
                </p>
                <Button asChild>
                  <Link to="/clients">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
