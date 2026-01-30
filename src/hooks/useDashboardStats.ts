import { useMemo } from "react";
import { parseISO, differenceInDays, isToday } from "date-fns";
import { useClients } from "./useClients";
import { useProperties } from "./useProperties";
import { useReminders } from "./useReminders";

export function useDashboardStats() {
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const { data: reminders = [], isLoading: remindersLoading } = useReminders();

  const stats = useMemo(() => {
    const today = new Date();

    const upcomingReminders = reminders.filter((r) => {
      if (r.is_completed) return false;
      const reminderDate = parseISO(r.reminder_date);
      const daysUntil = differenceInDays(reminderDate, today);
      return daysUntil >= 0 && daysUntil <= 30;
    });

    const todayReminders = reminders.filter((r) => {
      if (r.is_completed) return false;
      return isToday(parseISO(r.reminder_date));
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
      .filter((r) => !r.is_completed)
      .sort((a, b) => {
        const dateA = parseISO(a.reminder_date);
        const dateB = parseISO(b.reminder_date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10);
  }, [reminders]);

  const recentClients = useMemo(() => {
    return clients.slice(0, 5);
  }, [clients]);

  return {
    stats,
    sortedReminders,
    recentClients,
    clients,
    properties,
    reminders,
    isLoading: clientsLoading || propertiesLoading || remindersLoading,
  };
}
