import { useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Client } from '@/db/database';
import { toast } from '@/hooks/use-toast';
import { format, isSameDay, addDays, parseISO } from 'date-fns';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);

  // Check for notification support
  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setIsEnabled(result === 'granted');

      if (result === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive anniversary reminders.",
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
      return false;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'keykeep-reminder',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [permission]);

  const checkTodaysAnniversaries = useCallback(async () => {
    if (permission !== 'granted') return;

    const clients = await db.clients.toArray();
    const today = new Date();

    const todaysAnniversaries = clients.filter((client) => {
      if (!client.moveInDate) return false;
      const moveDate = parseISO(client.moveInDate);
      return moveDate.getMonth() === today.getMonth() && 
             moveDate.getDate() === today.getDate();
    });

    if (todaysAnniversaries.length > 0) {
      sendNotification(
        `🏠 ${todaysAnniversaries.length} Anniversary${todaysAnniversaries.length > 1 ? 's' : ''} Today!`,
        {
          body: todaysAnniversaries.map(c => c.name).join(', '),
          requireInteraction: true,
        }
      );
    }
  }, [permission, sendNotification]);

  const checkUpcomingAnniversaries = useCallback(async () => {
    if (permission !== 'granted') return;

    const clients = await db.clients.toArray();
    const tomorrow = addDays(new Date(), 1);

    const upcomingAnniversaries = clients.filter((client) => {
      if (!client.moveInDate) return false;
      const moveDate = parseISO(client.moveInDate);
      return moveDate.getMonth() === tomorrow.getMonth() && 
             moveDate.getDate() === tomorrow.getDate();
    });

    if (upcomingAnniversaries.length > 0) {
      sendNotification(
        `📅 ${upcomingAnniversaries.length} Anniversary${upcomingAnniversaries.length > 1 ? 's' : ''} Tomorrow`,
        {
          body: upcomingAnniversaries.map(c => c.name).join(', '),
        }
      );
    }
  }, [permission, sendNotification]);

  // Set up daily check
  useEffect(() => {
    if (permission !== 'granted') return;

    // Check immediately on load
    checkTodaysAnniversaries();

    // Set up interval to check every hour
    const interval = setInterval(() => {
      const now = new Date();
      // Check at 9 AM
      if (now.getHours() === 9 && now.getMinutes() === 0) {
        checkTodaysAnniversaries();
      }
      // Check at 6 PM for tomorrow's anniversaries
      if (now.getHours() === 18 && now.getMinutes() === 0) {
        checkUpcomingAnniversaries();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [permission, checkTodaysAnniversaries, checkUpcomingAnniversaries]);

  return {
    isSupported,
    permission,
    isEnabled,
    requestPermission,
    sendNotification,
    checkTodaysAnniversaries,
    checkUpcomingAnniversaries,
  };
}
