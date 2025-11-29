/**
 * Services Index
 * Central export point for all services
 */

// Firebase Services
export * from './firebaseAuthService';
export * from './firebaseDatabaseService';
export * from './firebaseStorageService';

// Firebase Config
export { app, auth, database, storage, getFirebaseConfig } from '../config/firebase';

// Existing Services
export * from './geminiService';
export * from './imageService';
export * from './storageService';

// Calendar & Notifications
export * from './calendarService';
