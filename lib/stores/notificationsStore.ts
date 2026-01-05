import { create } from 'zustand';
import { Notification } from '../../app/types';

interface NotificationsState {
  notifications: Notification[];
  lastFetched: number | null;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string | number) => void;
  clearAll: () => void;
  isStale: () => boolean;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (notifications change frequently)

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  lastFetched: null,

  setNotifications: (notifications: Notification[]) => {
    set({ notifications, lastFetched: Date.now() });
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  removeNotification: (id: string | number) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({
      notifications: [],
      lastFetched: null,
    });
  },

  isStale: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    return Date.now() - lastFetched > CACHE_DURATION;
  },
}));