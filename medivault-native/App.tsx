/**
 * MediVault AI - React Native Application
 * A personal medical assistant that digitizes medical documents using AI
 *
 * @author MediVault Team
 * @version 1.0.0
 */

import React, { useEffect } from "react";
import {
  StatusBar,
  LogBox,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Import Firebase config to ensure it's initialized
import "./src/config/firebase";

// Import i18n to initialize localization
import "./src/localization/i18n";

import RootNavigator from "./src/navigation/RootNavigator";
import AuthNavigator from "./src/navigation/AuthNavigator";
import { useRecordStore } from "./src/store/useRecordStore";
import { useAuthStore } from "./src/store/useAuthStore";
import { useNotificationStore } from "./src/store/useNotificationStore";
import { useFamilyStore } from "./src/store/useFamilyStore";
import { colors, spacing, fontSize, fontWeight } from "./src/theme";
import {
  registerBackgroundTask,
  setCurrentUserId,
  clearCurrentUserId,
} from "./src/services/medicationReminderService";

// Ignore specific warnings (optional)
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "AsyncStorage has been extracted from react-native core",
  "@firebase/auth",
  "permission_denied", // Expected during sign out - Firebase subscriptions cleanup
  "Notification subscription error",
  "Notifications subscription error",
  "Firebase subscription error",
  "Firebase lab test records subscription error",
  "Firebase taken medications subscription error",
]);

/**
 * Loading Screen Component
 * Shows while Firebase auth is initializing
 */
const LoadingScreen: React.FC<{ message?: string }> = ({ message }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary[500]} />
    {message && <Text style={styles.loadingText}>{message}</Text>}
  </View>
);

/**
 * Main App Component
 * Sets up providers, Firebase initialization, and navigation container
 */
const App: React.FC = () => {
  const { initializeWithUser, isSyncing } = useRecordStore();
  const { initialize, isInitialized, isLoading, isSigningOut, user } =
    useAuthStore();

  // Initialize Firebase Auth listener on app start
  useEffect(() => {
    const unsubscribe = initialize();

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [initialize]);

  // Register background task on app mount
  useEffect(() => {
    registerBackgroundTask().catch((error) => {
      console.error("Failed to register background task:", error);
    });
  }, []);

  // Initialize record store when user is authenticated
  useEffect(() => {
    if (user?.uid) {
      // User is authenticated, initialize record store with real-time Firebase subscription
      initializeWithUser(user.uid);

      // Set user ID for background task
      setCurrentUserId(user.uid).catch((error) => {
        console.error("Failed to set current user ID:", error);
      });
    } else if (isInitialized && !user) {
      // User logged out - cleanup is now handled in authStore.signOut()
      // Clear user ID for background task
      clearCurrentUserId().catch((error) => {
        console.error("Failed to clear current user ID:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Note: initializeWithUser is a stable Zustand store function
  }, [user?.uid, isInitialized]);

  // Show loading screen while Firebase auth is initializing
  if (!isInitialized && isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LoadingScreen message="Initializing..." />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Show syncing indicator when migrating local data to Firebase
  if (user && isSyncing) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LoadingScreen message="Syncing your data..." />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Show signing out indicator to prevent flash of app screen
  if (isSigningOut) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LoadingScreen message="Signing out..." />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={colors.background.primary}
          />
          {user ? <RootNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    gap: spacing["4"],
  },
  loadingText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing["4"],
  },
});

export default App;
