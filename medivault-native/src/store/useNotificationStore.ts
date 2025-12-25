/**
 * Notification Store
 * Manages in-app notifications using Zustand
 */

import { create } from "zustand";
import { Notification } from "../types";
import {
  getUserNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
} from "../services/notificationService";

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadNotifications: (userId: string) => Promise<void>;
  refreshUnreadCount: (userId: string) => Promise<void>;
  markNotificationAsRead: (
    userId: string,
    notificationId: string
  ) => Promise<void>;
  markAllNotificationsAsRead: (userId: string) => Promise<void>;
  deleteNotificationById: (
    userId: string,
    notificationId: string
  ) => Promise<void>;
  subscribe: (userId: string) => () => void;
  clearError: () => void;
  reset: () => void;
}

let unsubscribeFunction: (() => void) | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  /**
   * Load all notifications for a user
   */
  loadNotifications: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const notifications = await getUserNotifications(userId);
      const unreadCount = await getUnreadCount(userId);

      set({
        notifications,
        unreadCount,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to load notifications",
      });
      throw error;
    }
  },

  /**
   * Refresh unread count only
   */
  refreshUnreadCount: async (userId: string) => {
    try {
      const unreadCount = await getUnreadCount(userId);
      set({ unreadCount });
    } catch (error: any) {
      console.error("Error refreshing unread count:", error);
    }
  },

  /**
   * Mark a notification as read
   */
  markNotificationAsRead: async (userId: string, notificationId: string) => {
    try {
      await markAsRead(userId, notificationId);

      // Update local state
      const { notifications } = get();
      const updatedNotifications = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );

      const unreadCount = updatedNotifications.filter((n) => !n.read).length;

      set({
        notifications: updatedNotifications,
        unreadCount,
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to mark notification as read" });
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: async (userId: string) => {
    try {
      await markAllAsRead(userId);

      // Update local state
      const { notifications } = get();
      const updatedNotifications = notifications.map((n) => ({
        ...n,
        read: true,
      }));

      set({
        notifications: updatedNotifications,
        unreadCount: 0,
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to mark all as read" });
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  deleteNotificationById: async (userId: string, notificationId: string) => {
    try {
      await deleteNotification(userId, notificationId);

      // Update local state
      const { notifications } = get();
      const updatedNotifications = notifications.filter(
        (n) => n.id !== notificationId
      );
      const unreadCount = updatedNotifications.filter((n) => !n.read).length;

      set({
        notifications: updatedNotifications,
        unreadCount,
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to delete notification" });
      throw error;
    }
  },

  /**
   * Subscribe to real-time notification updates
   */
  subscribe: (userId: string) => {
    // Unsubscribe from previous subscription if exists
    if (unsubscribeFunction) {
      unsubscribeFunction();
    }

    unsubscribeFunction = subscribeToNotifications(
      userId,
      (notifications) => {
        const unreadCount = notifications.filter((n) => !n.read).length;
        set({ notifications, unreadCount });
      },
      (error) => {
        console.error("Notifications subscription error:", error);
        set({ error: error.message });
      }
    );

    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction();
        unsubscribeFunction = null;
      }
    };
  },

  /**
   * Clear error messages
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset state (on sign out)
   */
  reset: () => {
    if (unsubscribeFunction) {
      unsubscribeFunction();
      unsubscribeFunction = null;
    }

    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
    });
  },
}));

// Selector hooks
export const useNotifications = () => {
  return useNotificationStore((state) => state.notifications);
};

export const useUnreadCount = () => {
  return useNotificationStore((state) => state.unreadCount);
};

export const useNotificationActions = () => {
  const {
    loadNotifications,
    refreshUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    subscribe,
    clearError,
    reset,
  } = useNotificationStore();

  return {
    loadNotifications,
    refreshUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    subscribe,
    clearError,
    reset,
  };
};

/**
 * Get unread notifications only
 */
export const useUnreadNotifications = () => {
  return useNotificationStore((state) =>
    state.notifications.filter((n) => !n.read)
  );
};
