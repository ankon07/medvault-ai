/**
 * Notification Service
 * Handles in-app notifications and push notifications
 */

import {
  ref,
  push,
  set,
  get,
  update,
  query,
  orderByChild,
  equalTo,
  onValue,
  off,
  DataSnapshot,
} from "firebase/database";
import * as ExpoNotifications from "expo-notifications";
import { database } from "../config/firebase";
import { Notification } from "../types";

const NOTIFICATIONS_PATH = "notifications";

/**
 * Configure notification behavior
 */
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Create a new notification for a user
 */
export const createNotification = async (
  userId: string,
  notificationData: Omit<Notification, "id" | "createdAt">
): Promise<string> => {
  const notificationsRef = ref(database, `${NOTIFICATIONS_PATH}/${userId}`);
  const newNotificationRef = push(notificationsRef);

  const notification: Notification = {
    ...notificationData,
    id: newNotificationRef.key!,
    createdAt: Date.now(),
  };

  await set(newNotificationRef, notification);

  // Send push notification if app is in background
  await sendPushNotification(notification.title, notification.message);

  return newNotificationRef.key!;
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (
  userId: string
): Promise<Notification[]> => {
  const notificationsRef = ref(database, `${NOTIFICATIONS_PATH}/${userId}`);
  const snapshot = await get(notificationsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const notifications: Notification[] = [];
  snapshot.forEach((childSnapshot: DataSnapshot) => {
    notifications.push(childSnapshot.val() as Notification);
  });

  return notifications.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Get unread notifications for a user
 */
export const getUnreadNotifications = async (
  userId: string
): Promise<Notification[]> => {
  const notifications = await getUserNotifications(userId);
  return notifications.filter((n) => !n.read);
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const unread = await getUnreadNotifications(userId);
  return unread.length;
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  const notificationRef = ref(
    database,
    `${NOTIFICATIONS_PATH}/${userId}/${notificationId}`
  );
  await update(notificationRef, { read: true });
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  const notifications = await getUserNotifications(userId);
  const updates: Record<string, any> = {};

  notifications.forEach((notification) => {
    if (!notification.read) {
      updates[`${NOTIFICATIONS_PATH}/${userId}/${notification.id}/read`] = true;
    }
  });

  if (Object.keys(updates).length > 0) {
    await update(ref(database), updates);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  const notificationRef = ref(
    database,
    `${NOTIFICATIONS_PATH}/${userId}/${notificationId}`
  );
  await set(notificationRef, null);
};

/**
 * Subscribe to real-time notification updates
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const notificationsRef = ref(database, `${NOTIFICATIONS_PATH}/${userId}`);

  const listener = onValue(
    notificationsRef,
    (snapshot: DataSnapshot) => {
      const notifications: Notification[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          notifications.push(childSnapshot.val() as Notification);
        });
      }
      callback(notifications.sort((a, b) => b.createdAt - a.createdAt));
    },
    (error) => {
      console.error("Notification subscription error:", error);
      onError?.(error);
    }
  );

  return () => off(notificationsRef, "value", listener);
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } =
    await ExpoNotifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await ExpoNotifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
};

/**
 * Send a push notification
 */
export const sendPushNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> => {
  try {
    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission) {
      console.log("No notification permission");
      return;
    }

    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (
  userId: string,
  notificationId: string
): Promise<Notification | null> => {
  const notificationRef = ref(
    database,
    `${NOTIFICATIONS_PATH}/${userId}/${notificationId}`
  );
  const snapshot = await get(notificationRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as Notification;
};

/**
 * Create a family request notification
 */
export const createFamilyRequestNotification = async (
  userId: string,
  fromUserName: string,
  requestId: string
): Promise<string> => {
  return createNotification(userId, {
    type: "family_request",
    title: "Family Invitation",
    message: `${fromUserName} invited you to join their family`,
    data: { requestId },
    read: false,
  });
};

/**
 * Create a request accepted notification
 */
export const createRequestAcceptedNotification = async (
  userId: string,
  acceptedByName: string
): Promise<string> => {
  return createNotification(userId, {
    type: "request_accepted",
    title: "Request Accepted",
    message: `${acceptedByName} accepted your family invitation`,
    data: {},
    read: false,
  });
};

/**
 * Create a request declined notification
 */
export const createRequestDeclinedNotification = async (
  userId: string,
  declinedByEmail: string
): Promise<string> => {
  return createNotification(userId, {
    type: "request_declined",
    title: "Request Declined",
    message: `${declinedByEmail} declined your family invitation`,
    data: {},
    read: false,
  });
};

/**
 * Create a family member left notification
 */
export const createMemberLeftNotification = async (
  userId: string,
  memberName: string
): Promise<string> => {
  return createNotification(userId, {
    type: "family_member_left",
    title: "Member Left Family",
    message: `${memberName} left your family`,
    data: {},
    read: false,
  });
};
