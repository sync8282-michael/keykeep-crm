import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db, Reminder, generateId, calculateNextDueDate } from '@/db/database';
import { toast } from '@/hooks/use-toast';
import { triggerAutoSync } from '@/hooks/useAutoSync';
import { format, parseISO, isBefore, addDays } from 'date-fns';

export function useReminders() {
  const reminders = useLiveQuery(() => 
    db.reminders.orderBy('reminderDate').toArray()
  );

  return { reminders, isLoading: reminders === undefined };
}

export function useRemindersByClient(clientId: string | undefined) {
  const reminders = useLiveQuery(
    () => clientId 
      ? db.reminders.where('clientId').equals(clientId).toArray() 
      : [],
    [clientId]
  );

  return { reminders, isLoading: reminders === undefined };
}

export function useTodaysReminders() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const reminders = useLiveQuery(async () => {
    const allReminders = await db.reminders
      .where('status')
      .equals('pending')
      .toArray();
    
    return allReminders.filter(r => {
      const dueDate = r.nextDueDate || r.reminderDate;
      return dueDate === today || isBefore(parseISO(dueDate), new Date());
    });
  });

  return { reminders, isLoading: reminders === undefined };
}

export function useUpcomingReminders(days: number = 7) {
  const reminders = useLiveQuery(async () => {
    const allReminders = await db.reminders
      .where('status')
      .equals('pending')
      .toArray();
    
    const endDate = addDays(new Date(), days);
    
    return allReminders.filter(r => {
      const dueDate = parseISO(r.nextDueDate || r.reminderDate);
      return isBefore(dueDate, endDate);
    }).sort((a, b) => {
      const dateA = a.nextDueDate || a.reminderDate;
      const dateB = b.nextDueDate || b.reminderDate;
      return dateA.localeCompare(dateB);
    });
  }, [days]);

  return { reminders, isLoading: reminders === undefined };
}

export function useReminderMutations() {
  const createReminder = useCallback(async (
    data: Omit<Reminder, 'id' | 'completedCount' | 'status' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    const id = generateId();
    
    // Calculate next due date for recurring reminders
    let nextDueDate = data.reminderDate;
    if (data.isRecurring && data.recurrencePattern) {
      const calculated = calculateNextDueDate(data.baseDate, data.recurrencePattern);
      nextDueDate = format(calculated, 'yyyy-MM-dd');
    }

    await db.reminders.add({
      ...data,
      id,
      completedCount: 0,
      status: 'pending',
      nextDueDate,
      createdAt: now,
      updatedAt: now,
    });

    toast({
      title: "Reminder Created",
      description: `Reminder scheduled for ${format(parseISO(nextDueDate), 'MMM d, yyyy')}`,
    });

    // Trigger auto-sync
    triggerAutoSync();

    return id;
  }, []);

  const updateReminder = useCallback(async (id: string, data: Partial<Reminder>) => {
    await db.reminders.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    toast({
      title: "Reminder Updated",
      description: "Your reminder has been updated.",
    });

    // Trigger auto-sync
    triggerAutoSync();
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    await db.reminders.delete(id);

    toast({
      title: "Reminder Deleted",
      description: "The reminder has been removed.",
    });

    // Trigger auto-sync
    triggerAutoSync();
  }, []);

  const markAsSent = useCallback(async (id: string) => {
    const reminder = await db.reminders.get(id);
    if (!reminder) return;

    const now = new Date().toISOString();
    const newCompletedCount = reminder.completedCount + 1;

    // Check if fully completed
    const isFullyCompleted = reminder.recurrenceCount 
      ? newCompletedCount >= reminder.recurrenceCount 
      : false;

    if (reminder.isRecurring && !isFullyCompleted && reminder.recurrencePattern) {
      // Calculate next occurrence
      const nextDate = calculateNextDueDate(
        reminder.baseDate, 
        reminder.recurrencePattern,
        new Date()
      );

      await db.reminders.update(id, {
        completedCount: newCompletedCount,
        lastSentAt: now,
        nextDueDate: format(nextDate, 'yyyy-MM-dd'),
        status: 'pending',
        updatedAt: now,
      });
    } else {
      // One-time or fully completed recurring reminder
      await db.reminders.update(id, {
        completedCount: newCompletedCount,
        lastSentAt: now,
        isCompleted: true,
        status: 'sent',
        updatedAt: now,
      });
    }

    toast({
      title: "Marked as Sent",
      description: reminder.isRecurring && !isFullyCompleted 
        ? "Next reminder scheduled." 
        : "Reminder completed.",
    });

    // Trigger auto-sync
    triggerAutoSync();
  }, []);

  const snoozeReminder = useCallback(async (id: string, days: number = 1) => {
    const reminder = await db.reminders.get(id);
    if (!reminder) return;

    const newDate = addDays(new Date(), days);

    await db.reminders.update(id, {
      nextDueDate: format(newDate, 'yyyy-MM-dd'),
      status: 'snoozed',
      updatedAt: new Date().toISOString(),
    });

    toast({
      title: "Reminder Snoozed",
      description: `Rescheduled for ${format(newDate, 'MMM d, yyyy')}`,
    });

    // Trigger auto-sync
    triggerAutoSync();
  }, []);

  return {
    createReminder,
    updateReminder,
    deleteReminder,
    markAsSent,
    snoozeReminder,
  };
}

// Auto-create anniversary reminders for new clients
export async function createAnniversaryReminder(
  clientId: string,
  clientName: string,
  moveInDate: string,
  channel: Reminder['channel'] = 'email'
) {
  const id = generateId();
  const now = new Date().toISOString();
  const nextDue = calculateNextDueDate(moveInDate, 'yearly');

  await db.reminders.add({
    id,
    clientId,
    title: `${clientName}'s Home Anniversary`,
    description: `Send anniversary message to ${clientName}`,
    type: 'anniversary',
    channel,
    baseDate: moveInDate,
    reminderDate: format(nextDue, 'yyyy-MM-dd'),
    nextDueDate: format(nextDue, 'yyyy-MM-dd'),
    isRecurring: true,
    recurrencePattern: 'yearly',
    completedCount: 0,
    isCompleted: false,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });

  // Trigger auto-sync
  triggerAutoSync();
}

// Create birthday reminder
export async function createBirthdayReminder(
  clientId: string,
  clientName: string,
  birthday: string,
  channel: Reminder['channel'] = 'email'
) {
  const id = generateId();
  const now = new Date().toISOString();
  const nextDue = calculateNextDueDate(birthday, 'yearly');

  await db.reminders.add({
    id,
    clientId,
    title: `${clientName}'s Birthday`,
    description: `Send birthday wishes to ${clientName}`,
    type: 'birthday',
    channel,
    baseDate: birthday,
    reminderDate: format(nextDue, 'yyyy-MM-dd'),
    nextDueDate: format(nextDue, 'yyyy-MM-dd'),
    isRecurring: true,
    recurrencePattern: 'yearly',
    completedCount: 0,
    isCompleted: false,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });

  // Trigger auto-sync
  triggerAutoSync();
}
