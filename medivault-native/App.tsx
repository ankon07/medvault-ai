/**
 * MediVault AI - React Native Application
 * A personal medical assistant that digitizes medical documents using AI
 * 
 * @author MediVault Team
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import Firebase config to ensure it's initialized
import './src/config/firebase';

import RootNavigator from './src/navigation/RootNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { useRecordStore } from './src/store/useRecordStore';
import { useAuthStore } from './src/store/useAuthStore';
import { colors, spacing, fontSize, fontWeight } from './src/theme';

// Ignore specific warnings (optional)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'AsyncStorage has been extracted from react-native core',
  '@firebase/auth',
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
  const { initializeWithUser, cleanup, isSyncing } = useRecordStore();
  const { initialize, isInitialized, isLoading, user } = useAuthStore();

  // Initialize Firebase Auth listener on app start
  useEffect(() => {
    const unsubscribe = initialize();
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [initialize]);

  // Initialize record store when user is authenticated
  useEffect(() => {
    if (user?.uid) {
      // User is authenticated, initialize record store with real-time Firebase subscription
      initializeWithUser(user.uid);
    } else if (isInitialized && !user) {
      // User logged out, cleanup record store
      cleanup();
    }
  }, [user?.uid, isInitialized, initializeWithUser, cleanup]);

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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    gap: spacing['4'],
  },
  loadingText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing['4'],
  },
});

export default App;
