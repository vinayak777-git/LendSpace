import { Notification, Booking } from '../types';
import { getItem, setItem, initStorage } from './storage';
import { logEvent } from './auditService';

initStorage();

export const notificationService = {
  async getNotifications(userId?: string): Promise<Notification[]> {
    const list = getItem<Notification[]>('NOTIFICATIONS', []);
    if (!userId) {
      return [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return list
      .filter((n) => n.userId === userId || n.userId === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAsRead(id: string): Promise<void> {
    const list = getItem<Notification[]>('NOTIFICATIONS', []);
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    setItem('NOTIFICATIONS', updated);
  },

  async markAllAsRead(userId: string): Promise<void> {
    const list = getItem<Notification[]>('NOTIFICATIONS', []);
    const updated = list.map((n) =>
      n.userId === userId || n.userId === 'all' ? { ...n, read: true } : n
    );
    setItem('NOTIFICATIONS', updated);
  },

  async addNotification(
    data: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ): Promise<Notification> {
    const list = getItem<Notification[]>('NOTIFICATIONS', []);
    const newNotif: Notification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newNotif);
    setItem('NOTIFICATIONS', list);
    return newNotif;
  },

  /**
   * Simulates 3 hours passing:
   * 1. Finds active bookings past their end time and flags them as overdue
   * 2. Finds bookings starting within 1 hour and generates reminders
   */
  async simulateTimePassing(): Promise<{ overdueUpdated: number; remindersAdded: number }> {
    const bookings = getItem<Booking[]>('BOOKINGS', []);
    const now = new Date();
    let overdueUpdated = 0;
    let remindersAdded = 0;

    // Advance time by 3 hours for checking
    const simulatedNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const updatedBookings = bookings.map((b) => {
      const endTime = new Date(b.end);
      if (
        (b.status === 'checked_in' || b.status === 'approved') &&
        simulatedNow > endTime
      ) {
        overdueUpdated++;
        // Add overdue notification
        notificationService.addNotification({
          userId: b.userId,
          type: 'overdue',
          title: 'Session Overdue Alert',
          message: `Your booking for resource (${b.resourceId}) was scheduled to finish by ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please submit your return condition report immediately to avoid penalties.`,
          link: '/bookings',
        });

        logEvent(
          { id: 'system', name: 'Simulation Engine', role: 'system' },
          'BOOKING_MARKED_OVERDUE',
          b.id,
          'booking',
          'Automatic detection: Session exceeded scheduled end time during simulated time window.'
        );

        return {
          ...b,
          status: 'overdue' as const,
          decisionReason: 'System flagged session as overdue after scheduled return window closed.',
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    });

    if (overdueUpdated > 0) {
      setItem('BOOKINGS', updatedBookings);
    }

    // Reminders for bookings in the near window
    for (const b of updatedBookings) {
      if (b.status === 'approved') {
        const startTime = new Date(b.start);
        const diffMinutes = (startTime.getTime() - simulatedNow.getTime()) / (1000 * 60);
        if (diffMinutes > 0 && diffMinutes <= 90) {
          remindersAdded++;
          notificationService.addNotification({
            userId: b.userId,
            type: 'reminder',
            title: '1-Hour Upcoming Booking Reminder',
            message: `Your session begins at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Check-in and safety inspection open 15 minutes before start.`,
            link: '/bookings',
          });
        }
      }
    }

    return { overdueUpdated, remindersAdded };
  },
};
