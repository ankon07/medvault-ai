/**
 * MediVault AI - Settings Screen
 * Comprehensive app settings and preferences
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Bell,
  Lock,
  Heart,
  Settings as SettingsIcon,
  Database,
  Info,
  ChevronRight,
  Globe,
  Calendar as CalendarIcon,
  Smartphone,
  Shield,
  Moon,
  Volume2,
  Users,
  Clock,
  Sparkles,
  Cloud,
  Trash2,
  FileDown,
  HelpCircle,
  Star,
  Share2,
} from "lucide-react-native";
import { Header } from "../components/common";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
} from "../theme";
import { useAuthStore } from "../store/useAuthStore";
import { useBiometric } from "../store/useAuthStore";
import { AppSettings } from "../types";

/**
 * Settings screen component
 */
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { biometricAvailable, biometricEnabled } = useBiometric();

  // Settings state
  const [settings, setSettings] = useState<Partial<AppSettings>>({
    pushNotificationsEnabled: true,
    medicationRemindersEnabled: true,
    familyActivityNotificationsEnabled: true,
    notificationSoundEnabled: true,
    biometricLoginEnabled: biometricEnabled,
    autoLockTimeout: "5min",
    requireAuthForSensitiveData: false,
    defaultReminderMinutes: 30,
    autoAddToCalendar: false,
    medicationTrackingEnabled: true,
    aiSuggestionsEnabled: true,
    language: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    darkModeEnabled: false,
    showBadgeCount: true,
    cloudSyncEnabled: true,
  });

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleSetting = (key: keyof AppSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. The app will reload. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            // Implement cache clearing
            Alert.alert("Success", "Cache cleared successfully!");
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Export all your medical records and data as a secure file?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: () => {
            // Implement data export
            Alert.alert("Success", "Data exported successfully!");
          },
        },
      ]
    );
  };

  const openURL = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open link")
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Settings" onBack={handleBack} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.card}>
            <ToggleItem
              icon={<Bell size={20} color={colors.gray[600]} />}
              label="Push Notifications"
              description="Receive notifications from the app"
              value={settings.pushNotificationsEnabled || false}
              onValueChange={() => toggleSetting("pushNotificationsEnabled")}
            />
            <ToggleItem
              icon={<Heart size={20} color={colors.red[500]} />}
              label="Medication Reminders"
              description="Get reminded to take your medications"
              value={settings.medicationRemindersEnabled || false}
              onValueChange={() => toggleSetting("medicationRemindersEnabled")}
            />
            <ToggleItem
              icon={<Users size={20} color={colors.green[600]} />}
              label="Family Activity"
              description="Notifications about family members"
              value={settings.familyActivityNotificationsEnabled || false}
              onValueChange={() =>
                toggleSetting("familyActivityNotificationsEnabled")
              }
            />
            <ToggleItem
              icon={<Volume2 size={20} color={colors.blue[500]} />}
              label="Sound & Vibration"
              description="Play sound for notifications"
              value={settings.notificationSoundEnabled || false}
              onValueChange={() => toggleSetting("notificationSoundEnabled")}
              isLast
            />
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={colors.orange[500]} />
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
          </View>

          <View style={styles.card}>
            {biometricAvailable && (
              <ToggleItem
                icon={<Smartphone size={20} color={colors.purple[600]} />}
                label="Biometric Login"
                description="Use fingerprint or face ID"
                value={settings.biometricLoginEnabled || false}
                onValueChange={() => toggleSetting("biometricLoginEnabled")}
              />
            )}
            <NavigationItem
              icon={<Clock size={20} color={colors.gray[600]} />}
              label="Auto-lock"
              value={settings.autoLockTimeout || "5min"}
              onPress={() => {
                // Show auto-lock options
                Alert.alert("Auto-lock", "Feature coming soon!");
              }}
            />
            <ToggleItem
              icon={<Shield size={20} color={colors.green[600]} />}
              label="Auth for Sensitive Data"
              description="Require authentication for medical data"
              value={settings.requireAuthForSensitiveData || false}
              onValueChange={() => toggleSetting("requireAuthForSensitiveData")}
              isLast
            />
          </View>
        </View>

        {/* Medical Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color={colors.red[500]} />
            <Text style={styles.sectionTitle}>Medical Settings</Text>
          </View>

          <View style={styles.card}>
            <NavigationItem
              icon={<Clock size={20} color={colors.blue[500]} />}
              label="Default Reminder Time"
              value={`${settings.defaultReminderMinutes || 30} minutes before`}
              onPress={() => {
                Alert.alert("Reminder Time", "Feature coming soon!");
              }}
            />
            <ToggleItem
              icon={<CalendarIcon size={20} color={colors.purple[600]} />}
              label="Auto-add to Calendar"
              description="Add medication reminders to calendar"
              value={settings.autoAddToCalendar || false}
              onValueChange={() => toggleSetting("autoAddToCalendar")}
            />
            <ToggleItem
              icon={<Heart size={20} color={colors.red[500]} />}
              label="Medication Tracking"
              description="Track when medications are taken"
              value={settings.medicationTrackingEnabled || false}
              onValueChange={() => toggleSetting("medicationTrackingEnabled")}
            />
            <ToggleItem
              icon={<Sparkles size={20} color={colors.orange[500]} />}
              label="AI Suggestions"
              description="Get smart health suggestions"
              value={settings.aiSuggestionsEnabled || false}
              onValueChange={() => toggleSetting("aiSuggestionsEnabled")}
              isLast
            />
          </View>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SettingsIcon size={20} color={colors.gray[600]} />
            <Text style={styles.sectionTitle}>General</Text>
          </View>

          <View style={styles.card}>
            <NavigationItem
              icon={<Globe size={20} color={colors.blue[600]} />}
              label="Language"
              value={settings.language === "en" ? "English" : "বাংলা"}
              onPress={() => {
                Alert.alert("Language", "Feature coming soon!");
              }}
            />
            <NavigationItem
              icon={<CalendarIcon size={20} color={colors.purple[600]} />}
              label="Date Format"
              value={settings.dateFormat || "DD/MM/YYYY"}
              onPress={() => {
                Alert.alert("Date Format", "Feature coming soon!");
              }}
            />
            <NavigationItem
              icon={<Clock size={20} color={colors.green[600]} />}
              label="Time Format"
              value={settings.timeFormat === "12h" ? "12-hour" : "24-hour"}
              onPress={() => {
                Alert.alert("Time Format", "Feature coming soon!");
              }}
            />
            <ToggleItem
              icon={<Moon size={20} color={colors.gray[700]} />}
              label="Dark Mode"
              description="Coming soon"
              value={settings.darkModeEnabled || false}
              onValueChange={() => toggleSetting("darkModeEnabled")}
              disabled
              isLast
            />
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color={colors.blue[600]} />
            <Text style={styles.sectionTitle}>Data & Storage</Text>
          </View>

          <View style={styles.card}>
            <ToggleItem
              icon={<Cloud size={20} color={colors.blue[500]} />}
              label="Cloud Sync"
              description="Sync data across devices"
              value={settings.cloudSyncEnabled || false}
              onValueChange={() => toggleSetting("cloudSyncEnabled")}
            />
            <InfoItem
              icon={<Database size={20} color={colors.gray[600]} />}
              label="Storage Used"
              value="45.2 MB"
            />
            <ActionItem
              icon={<FileDown size={20} color={colors.green[600]} />}
              label="Export Data"
              description="Download all your medical records"
              onPress={handleExportData}
            />
            <ActionItem
              icon={<Trash2 size={20} color={colors.orange[500]} />}
              label="Clear Cache"
              description="Free up storage space"
              onPress={handleClearCache}
              isLast
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color={colors.purple[600]} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>

          <View style={styles.card}>
            <InfoItem
              icon={<Info size={20} color={colors.primary[600]} />}
              label="Version"
              value="1.0.0"
            />
            <ActionItem
              icon={<HelpCircle size={20} color={colors.blue[600]} />}
              label="Help & Support"
              onPress={() => openURL("https://medivault.com/support")}
            />
            <ActionItem
              icon={<Star size={20} color={colors.orange[500]} />}
              label="Rate MediVault AI"
              onPress={() => {
                Alert.alert("Thank you!", "Feature coming soon!");
              }}
            />
            <ActionItem
              icon={<Share2 size={20} color={colors.green[600]} />}
              label="Share App"
              onPress={() => {
                Alert.alert("Share", "Feature coming soon!");
              }}
              isLast
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            MediVault AI - Your Personal Medical Assistant
          </Text>
          <Text style={styles.footerSubtext}>© 2024 All rights reserved</Text>
        </View>

        {/* Bottom padding */}
        <View style={{ height: spacing["8"] }} />
      </ScrollView>
    </View>
  );
};

// Reusable Toggle Item Component
const ToggleItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: () => void;
  disabled?: boolean;
  isLast?: boolean;
}> = ({ icon, label, description, value, onValueChange, disabled, isLast }) => {
  return (
    <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: colors.gray[300],
          true: colors.primary[600],
        }}
        thumbColor={colors.white}
      />
    </View>
  );
};

// Reusable Navigation Item Component
const NavigationItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  isLast?: boolean;
}> = ({ icon, label, value, onPress, isLast }) => {
  return (
    <TouchableOpacity
      style={[styles.settingItem, isLast && styles.settingItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue}>{value}</Text>
      </View>
      <ChevronRight size={20} color={colors.gray[400]} />
    </TouchableOpacity>
  );
};

// Reusable Info Item Component
const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}> = ({ icon, label, value, isLast }) => {
  return (
    <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
};

// Reusable Action Item Component
const ActionItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  description?: string;
  onPress: () => void;
  isDanger?: boolean;
  isLast?: boolean;
}> = ({ icon, label, description, onPress, isDanger, isLast }) => {
  return (
    <TouchableOpacity
      style={[styles.settingItem, isLast && styles.settingItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text
          style={[styles.settingLabel, isDanger && styles.settingLabelDanger]}
        >
          {label}
        </Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <ChevronRight size={20} color={colors.gray[400]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing["6"],
  },

  // Section
  section: {
    marginBottom: spacing["6"],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["2"],
    marginBottom: spacing["4"],
    paddingHorizontal: spacing["2"],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius["3xl"],
    overflow: "hidden",
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dangerCard: {
    backgroundColor: colors.red[50],
    borderRadius: borderRadius["3xl"],
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.red[100],
  },

  // Setting Item
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing["4"],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    marginRight: spacing["3"],
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing["1"],
  },
  settingLabelDanger: {
    color: colors.red[600],
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  settingValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginRight: spacing["2"],
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingTop: spacing["8"],
    paddingBottom: spacing["4"],
  },
  footerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    textAlign: "center",
  },
  footerSubtext: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing["1"],
  },
});

export default SettingsScreen;
