import { useState, useEffect, useMemo } from "react";
import { parseISO, differenceInDays, isToday, isPast, format } from "date-fns";
import { Bell, BellOff, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ReminderCard } from "@/components/dashboard/ReminderCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client, Property, Reminder } from "@/types";
import { getClients, getProperties, getReminders, saveReminders } from "@/lib/store";

export default function Notifications() {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    setClients(getClients());
    setProperties(getProperties());
    setReminders(getReminders());
  }, []);

  const categorizedReminders = useMemo(() => {
    const today = new Date();

    const overdue = reminders.filter((r) => {
      if (r.isCompleted) return false;
      const reminderDate = parseISO(r.reminderDate);
      return isPast(reminderDate) && !isToday(reminderDate);
    });

    const todayReminders = reminders.filter((r) => {
      if (r.isCompleted) return false;
      return isToday(parseISO(r.reminderDate));
    });

    const upcoming = reminders.filter((r) => {
      if (r.isCompleted) return false;
      const reminderDate = parseISO(r.reminderDate);
      const daysUntil = differenceInDays(reminderDate, today);
      return daysUntil > 0 && daysUntil <= 30;
    });

    const completed = reminders.filter((r) => r.isCompleted);

    return { overdue, today: todayReminders, upcoming, completed };
  }, [reminders]);

  const handleCompleteReminder = (id: string) => {
    const updatedReminders = reminders.map((r) =>
      r.id === id ? { ...r, isCompleted: true } : r
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const handleMarkAllAsRead = () => {
    const overdueIds = categorizedReminders.overdue.map((r) => r.id);
    const updatedReminders = reminders.map((r) =>
      overdueIds.includes(r.id) ? { ...r, isCompleted: true } : r
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const getClientById = (id: string) => clients.find((c) => c.id === id);
  const getPropertyById = (id: string) => properties.find((p) => p.id === id);

  const totalActive =
    categorizedReminders.overdue.length +
    categorizedReminders.today.length +
    categorizedReminders.upcoming.length;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">
              {totalActive} active {totalActive === 1 ? "reminder" : "reminders"}
            </p>
          </div>
          {categorizedReminders.overdue.length > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark overdue as complete
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="card-elevated">
          <div className="px-6 pt-4 border-b border-border">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Bell className="w-4 h-4" />
                All ({totalActive})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue ({categorizedReminders.overdue.length})
              </TabsTrigger>
              <TabsTrigger value="today" className="gap-2">
                <Clock className="w-4 h-4" />
                Today ({categorizedReminders.today.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="gap-2">
                Upcoming ({categorizedReminders.upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed ({categorizedReminders.completed.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="p-6">
            {totalActive > 0 ? (
              <div className="space-y-6">
                {categorizedReminders.overdue.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Overdue
                    </h3>
                    <div className="grid gap-3">
                      {categorizedReminders.overdue.map((reminder) => (
                        <ReminderCard
                          key={reminder.id}
                          reminder={reminder}
                          client={getClientById(reminder.clientId)}
                          property={
                            reminder.propertyId
                              ? getPropertyById(reminder.propertyId)
                              : undefined
                          }
                          onComplete={handleCompleteReminder}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {categorizedReminders.today.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Today
                    </h3>
                    <div className="grid gap-3">
                      {categorizedReminders.today.map((reminder) => (
                        <ReminderCard
                          key={reminder.id}
                          reminder={reminder}
                          client={getClientById(reminder.clientId)}
                          property={
                            reminder.propertyId
                              ? getPropertyById(reminder.propertyId)
                              : undefined
                          }
                          onComplete={handleCompleteReminder}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {categorizedReminders.upcoming.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Upcoming (next 30 days)
                    </h3>
                    <div className="grid gap-3">
                      {categorizedReminders.upcoming.map((reminder) => (
                        <ReminderCard
                          key={reminder.id}
                          reminder={reminder}
                          client={getClientById(reminder.clientId)}
                          property={
                            reminder.propertyId
                              ? getPropertyById(reminder.propertyId)
                              : undefined
                          }
                          onComplete={handleCompleteReminder}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <BellOff className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  All caught up!
                </h3>
                <p className="text-muted-foreground">
                  No pending reminders. Great job staying on top of things!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="p-6">
            {categorizedReminders.overdue.length > 0 ? (
              <div className="grid gap-3">
                {categorizedReminders.overdue.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    client={getClientById(reminder.clientId)}
                    property={
                      reminder.propertyId
                        ? getPropertyById(reminder.propertyId)
                        : undefined
                    }
                    onComplete={handleCompleteReminder}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                No overdue reminders.
              </p>
            )}
          </TabsContent>

          <TabsContent value="today" className="p-6">
            {categorizedReminders.today.length > 0 ? (
              <div className="grid gap-3">
                {categorizedReminders.today.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    client={getClientById(reminder.clientId)}
                    property={
                      reminder.propertyId
                        ? getPropertyById(reminder.propertyId)
                        : undefined
                    }
                    onComplete={handleCompleteReminder}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                No reminders for today.
              </p>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="p-6">
            {categorizedReminders.upcoming.length > 0 ? (
              <div className="grid gap-3">
                {categorizedReminders.upcoming.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    client={getClientById(reminder.clientId)}
                    property={
                      reminder.propertyId
                        ? getPropertyById(reminder.propertyId)
                        : undefined
                    }
                    onComplete={handleCompleteReminder}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                No upcoming reminders in the next 30 days.
              </p>
            )}
          </TabsContent>

          <TabsContent value="completed" className="p-6">
            {categorizedReminders.completed.length > 0 ? (
              <div className="grid gap-3">
                {categorizedReminders.completed.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    client={getClientById(reminder.clientId)}
                    property={
                      reminder.propertyId
                        ? getPropertyById(reminder.propertyId)
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                No completed reminders yet.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
