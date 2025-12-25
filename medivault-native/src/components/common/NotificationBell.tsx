/**
 * Notification Bell Component
 * Displays notification icon with unread count badge
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Bell, X, Check, CheckCheck } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing, textStyles, shadows } from "../../theme";
import { useAuth } from "../../store/useAuthStore";
import {
  useUnreadCount,
  useNotifications,
  useNotificationActions,
} from "../../store/useNotificationStore";
import { Notification } from "../../types";

interface NotificationBellProps {
  size?: number;
  color?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  size = 24,
  color = colors.text.primary,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const unreadCount = useUnreadCount();
  const notifications = useNotifications();
  const {
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    subscribe,
  } = useNotificationActions();

  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadNotifications(user.uid);
      const unsubscribe = subscribe(user.uid);
      return unsubscribe;
    }
  }, [user?.uid]);

  const handleBellPress = () => {
    setModalVisible(true);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!user?.uid) return;

    try {
      if (!notification.read) {
        await markNotificationAsRead(user.uid, notification.id);
      }

      // Handle notification action based on type
      if (
        notification.type === "family_request" &&
        notification.data.requestId
      ) {
        // Navigate to family requests or show accept/decline dialog
        // For now, just show an alert
        Alert.alert(
          t("notifications.familyRequest"),
          t("notifications.checkFamilyScreen")
        );
      }
    } catch (error) {
      console.error("Error handling notification press:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      await markAllNotificationsAsRead(user.uid);
      Alert.alert(t("common.success"), t("notifications.allMarkedAsRead"));
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!user?.uid) return;

    try {
      await deleteNotificationById(user.uid, notificationId);
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "family_request":
        return "👨‍👩‍👧‍👦";
      case "request_accepted":
        return "✅";
      case "request_declined":
        return "❌";
      case "family_member_left":
        return "👋";
      default:
        return "🔔";
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("notifications.justNow");
    if (minutes < 60) return t("notifications.minutesAgo", { count: minutes });
    if (hours < 24) return t("notifications.hoursAgo", { count: hours });
    return t("notifications.daysAgo", { count: days });
  };

  return (
    <>
      <TouchableOpacity style={styles.bellContainer} onPress={handleBellPress}>
        <Bell size={size} color={color} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("notifications.title")}</Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllAsRead}
                  disabled={isLoading}
                  style={styles.markAllButton}
                >
                  <CheckCheck size={20} color={colors.primary[600]} />
                  <Text style={styles.markAllText}>
                    {t("notifications.markAllRead")}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications List */}
          <ScrollView
            style={styles.notificationsList}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={48} color={colors.gray[300]} />
                <Text style={styles.emptyStateText}>
                  {t("notifications.noNotifications")}
                </Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationIcon}>
                      {getNotificationIcon(notification.type)}
                    </Text>
                    <View style={styles.notificationText}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTime(notification.createdAt)}
                      </Text>
                    </View>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteNotification(notification.id)}
                  >
                    <X size={16} color={colors.gray[400]} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bellContainer: {
    position: "relative",
    padding: spacing["2"],
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.red[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["1"],
  },
  badgeText: {
    ...textStyles.caption,
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing["4"],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["3"],
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["1"],
    paddingHorizontal: spacing["2"],
    paddingVertical: spacing["1"],
  },
  markAllText: {
    ...textStyles.caption,
    color: colors.primary[600],
    fontWeight: "600",
  },
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["24"],
  },
  emptyStateText: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing["4"],
  },
  notificationItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing["4"],
    marginHorizontal: spacing["4"],
    marginVertical: spacing["2"],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.sm,
  },
  unreadNotification: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  notificationContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing["3"],
  },
  notificationIcon: {
    fontSize: 28,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    ...textStyles.body,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing["1"],
  },
  notificationMessage: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing["1"],
  },
  notificationTime: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
    marginLeft: spacing["2"],
  },
  deleteButton: {
    padding: spacing["2"],
  },
});
