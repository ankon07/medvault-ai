/**
 * Firebase Configuration
 * Initializes and exports Firebase services for the MediVault app
 * 
 * Services included:
 * - Authentication
 * - Realtime Database
 * - Cloud Storage
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence is available at runtime
import { getReactNativePersistence } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

// Firebase configuration object
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firebase Services
// Use initializeAuth with AsyncStorage for React Native persistence
let auth: Auth;
if (getApps().length === 1) {
  // First initialization - use initializeAuth
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} else {
  // Already initialized - use getAuth
  auth = getAuth(app);
}

const database: Database = getDatabase(app);
const storage: FirebaseStorage = getStorage(app);

// Export Firebase instances
export { app, auth, database, storage };

// Export config for debugging (without sensitive data)
export const getFirebaseConfig = () => ({
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseURL,
  storageBucket: firebaseConfig.storageBucket,
});
