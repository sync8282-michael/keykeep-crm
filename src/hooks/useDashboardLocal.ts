import { useLiveQuery } from 'dexie-react-hooks';
import { db, Client } from '@/db/database';
import { useMemo } from 'react';
import { parseISO, isSameMonth, isSameDay, getMonth, getDate } from 'date-fns';

export function useDashboardStats() {
  const clients = useLiveQuery(() => db.clients.toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.get('app'));

  const stats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    // Calculate anniversaries this month
    const anniversariesThisMonth = clients.filter((client) => {
      if (!client.moveInDate) return false;
      const moveIn = parseISO(client.moveInDate);
      return getMonth(moveIn) === currentMonth;
    }).length;

    // Calculate anniversaries today
    const anniversariesToday = clients.filter((client) => {
      if (!client.moveInDate) return false;
      const moveIn = parseISO(client.moveInDate);
      return getMonth(moveIn) === currentMonth && getDate(moveIn) === currentDate;
    }).length;

    return {
      totalClients: clients.length,
      anniversariesThisMonth,
      anniversariesToday,
      lastBackupDate: settings?.lastBackupDate || null,
    };
  }, [clients, settings]);

  // Recent clients (last 5 added)
  const recentClients = useMemo(() => {
    return [...clients]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [clients]);

  return { stats, recentClients, clients, isLoading: clients === undefined };
}

// Get clients with anniversaries on a specific date (any year)
export function getClientsForDate(clients: Client[], date: Date): Client[] {
  const targetMonth = getMonth(date);
  const targetDate = getDate(date);

  return clients.filter((client) => {
    if (!client.moveInDate) return false;
    const moveIn = parseISO(client.moveInDate);
    return getMonth(moveIn) === targetMonth && getDate(moveIn) === targetDate;
  });
}

// Get clients with anniversaries in a month
export function getClientsForMonth(clients: Client[], date: Date): Client[] {
  const targetMonth = getMonth(date);

  return clients.filter((client) => {
    if (!client.moveInDate) return false;
    const moveIn = parseISO(client.moveInDate);
    return getMonth(moveIn) === targetMonth;
  });
}
