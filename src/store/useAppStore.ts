import { create } from 'zustand';
import {
  User,
  Resource,
  Booking,
  Incident,
  Notification,
  AuditEvent,
} from '../types';
import { userService } from '../services/userService';
import { resourceService } from '../services/resourceService';
import { bookingService } from '../services/bookingService';
import { incidentService } from '../services/incidentService';
import { notificationService } from '../services/notificationService';
import { auditService } from '../services/auditService';
import { resetToSeedData } from '../services/storage';

interface AppState {
  currentUser: User | null;
  users: User[];
  resources: Resource[];
  bookings: Booking[];
  incidents: Incident[];
  notifications: Notification[];
  auditEvents: AuditEvent[];
  isLoading: boolean;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' | 'warning' } | null;

  // Actions
  init: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  simulateTimePassing: () => Promise<{ overdueUpdated: number; remindersAdded: number }>;
  showToast: (text: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  resources: [],
  bookings: [],
  incidents: [],
  notifications: [],
  auditEvents: [],
  isLoading: true,
  toastMessage: null,

  init: async () => {
    set({ isLoading: true });
    try {
      const [currentUser, users, resources, bookings, incidents, notifications, auditEvents] =
        await Promise.all([
          userService.getCurrentUser(),
          userService.getUsers(),
          resourceService.getResources(),
          bookingService.getBookings(),
          incidentService.getIncidents(),
          notificationService.getNotifications(),
          auditService.getAuditEvents(),
        ]);

      set({
        currentUser,
        users,
        resources,
        bookings,
        incidents,
        notifications,
        auditEvents,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to initialize app state:', err);
      set({ isLoading: false });
    }
  },

  switchUser: async (userId: string) => {
    set({ isLoading: true });
    try {
      const updatedUser = await userService.setCurrentUser(userId);
      const notifications = await notificationService.getNotifications(userId);
      set({
        currentUser: updatedUser,
        notifications,
        isLoading: false,
      });
      get().showToast(`Switched active profile to ${updatedUser.name} (${updatedUser.role})`, 'info');
    } catch (err) {
      console.error('Failed to switch user:', err);
      set({ isLoading: false });
    }
  },

  refreshAll: async () => {
    const curId = get().currentUser?.id;
    const [currentUser, users, resources, bookings, incidents, notifications, auditEvents] =
      await Promise.all([
        userService.getCurrentUser(),
        userService.getUsers(),
        resourceService.getResources(),
        bookingService.getBookings(),
        incidentService.getIncidents(),
        notificationService.getNotifications(curId),
        auditService.getAuditEvents(),
      ]);

    set({
      currentUser,
      users,
      resources,
      bookings,
      incidents,
      notifications,
      auditEvents,
    });
  },

  resetDemoData: async () => {
    resetToSeedData();
    await get().init();
    get().showToast('Demo environment reset to initial state with fresh seed data.', 'success');
  },

  simulateTimePassing: async () => {
    const result = await notificationService.simulateTimePassing();
    await get().refreshAll();
    const message = `Time simulated (+3h): ${result.overdueUpdated} session(s) flagged overdue, ${result.remindersAdded} reminder(s) issued.`;
    get().showToast(message, 'warning');
    return result;
  },

  showToast: (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    set({ toastMessage: { text, type } });
    setTimeout(() => {
      if (get().toastMessage?.text === text) {
        set({ toastMessage: null });
      }
    }, 4500);
  },

  clearToast: () => set({ toastMessage: null }),
}));
