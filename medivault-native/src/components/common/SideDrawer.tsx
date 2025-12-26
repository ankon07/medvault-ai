/**
 * MediVault AI - Side Drawer Component
 * Modern animated side drawer with profile, settings, and sign out
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Alert,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, Settings, LogOut, X } from "lucide-react-native";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
} from "../../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  onSignOut: () => void;
}

/**
 * Side drawer component with smooth animations
 */
export const SideDrawer: React.FC<SideDrawerProps> = ({
  visible,
  onClose,
  userName = "User",
  userEmail = "",
  userInitials = "U",
  onProfilePress,
  onSettingsPress,
  onSignOut,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Open drawer
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close drawer
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  const handleProfilePress = () => {
    onClose();
    setTimeout(() => onProfilePress(), 300);
  };

  const handleSettingsPress = () => {
    onClose();
    setTimeout(() => onSettingsPress(), 300);
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            onClose();
            setTimeout(() => onSignOut(), 300);
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
          />
        </Pressable>

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_WIDTH,
              paddingTop: insets.top + spacing["6"],
              paddingBottom: insets.bottom + spacing["6"],
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.gray[600]} />
          </TouchableOpacity>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitials}</Text>
              </View>
              <View style={styles.avatarGlow} />
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            {userEmail && (
              <Text style={styles.userEmail} numberOfLines={1}>
                {userEmail}
              </Text>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Menu Items */}
          <View style={styles.menuSection}>
            {/* Profile */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleProfilePress}
              activeOpacity={0.7}
            >
              <View
                style={[styles.menuIcon, { backgroundColor: colors.blue[50] }]}
              >
                <User size={20} color={colors.blue[600]} />
              </View>
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSettingsPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: colors.purple[50] },
                ]}
              >
                <Settings size={20} color={colors.purple[600]} />
              </View>
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <LogOut size={20} color={colors.white} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* App Version */}
          <Text style={styles.versionText}>MediVault AI v1.0.0</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.gray[900],
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing["6"],
    ...shadows.xl,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: spacing["2"],
    marginBottom: spacing["4"],
  },

  // Profile Section
  profileSection: {
    alignItems: "center",
    paddingVertical: spacing["6"],
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing["4"],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.primary[200],
    ...shadows.md,
  },
  avatarGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[200],
    opacity: 0.3,
    top: 0,
    left: 0,
  },
  avatarText: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing["1"],
    textAlign: "center",
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing["4"],
  },

  // Menu Section
  menuSection: {
    gap: spacing["2"],
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing["4"],
    borderRadius: borderRadius["2xl"],
    backgroundColor: colors.gray[50],
    gap: spacing["4"],
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
    flex: 1,
  },

  // Spacer
  spacer: {
    flex: 1,
  },

  // Sign Out Button
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["4"],
    borderRadius: borderRadius["2xl"],
    backgroundColor: colors.red[500],
    gap: spacing["2"],
    marginBottom: spacing["3"],
    ...shadows.md,
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  // Version
  versionText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: "center",
  },
});

export default SideDrawer;
