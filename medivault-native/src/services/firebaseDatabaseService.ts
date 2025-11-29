/**
 * Firebase Realtime Database Service
 * Handles database operations for MediVault with user authentication
 */

import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  query,
  orderByChild,
  equalTo,
  onValue,
  off,
  DataSnapshot,
  DatabaseReference,
} from 'firebase/database';
import { database } from '../config/firebase';
import { MedicalRecord, Medication } from '../types';

// Types for Firebase operations
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationReminder {
  id?: string;
  medicationName: string;
  time: string;
  enabled: boolean;
  daysOfWeek: number[]; // 0-6, Sunday-Saturday
}

export interface UserSettings {
  notificationsEnabled: boolean;
  reminderMinutesBefore: number;
  calendarIntegration: boolean;
}

// Database paths
const PATHS = {
  users: 'users',
  records: 'records',
  reminders: 'reminders',
  settings: 'settings',
};

/**
 * Create or update a user profile
 */
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const userRef = ref(database, `${PATHS.users}/${profile.uid}`);
  await set(userRef, {
    ...profile,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Get a user profile by UID
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = ref(database, `${PATHS.users}/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() as UserProfile : null;
};

/**
 * Create a new medical record
 */
export const createRecord = async (
  userId: string,
  record: MedicalRecord
): Promise<string> => {
  const recordRef = ref(database, `${PATHS.records}/${userId}/${record.id}`);
  
  await set(recordRef, {
    ...record,
    userId,
    syncedAt: new Date().toISOString(),
  });
  
  return record.id;
};

/**
 * Get all records for a user
 */
export const getUserRecords = async (userId: string): Promise<MedicalRecord[]> => {
  const recordsRef = ref(database, `${PATHS.records}/${userId}`);
  const snapshot = await get(recordsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const records: MedicalRecord[] = [];
  snapshot.forEach((childSnapshot: DataSnapshot) => {
    const record = childSnapshot.val();
    // Remove the userId and syncedAt fields added by Firebase
    const { userId: _, syncedAt: __, ...cleanRecord } = record;
    records.push(cleanRecord as MedicalRecord);
  });
  
  return records.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Get a single record by ID
 */
export const getRecordById = async (
  userId: string,
  recordId: string
): Promise<MedicalRecord | null> => {
  const recordRef = ref(database, `${PATHS.records}/${userId}/${recordId}`);
  const snapshot = await get(recordRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const record = snapshot.val();
  const { userId: _, syncedAt: __, ...cleanRecord } = record;
  return cleanRecord as MedicalRecord;
};

/**
 * Update a medical record
 */
export const updateRecord = async (
  userId: string,
  recordId: string,
  updates: Partial<MedicalRecord>
): Promise<void> => {
  const recordRef = ref(database, `${PATHS.records}/${userId}/${recordId}`);
  await update(recordRef, {
    ...updates,
    syncedAt: new Date().toISOString(),
  });
};

/**
 * Delete a medical record
 */
export const deleteRecord = async (
  userId: string,
  recordId: string
): Promise<void> => {
  const recordRef = ref(database, `${PATHS.records}/${userId}/${recordId}`);
  await remove(recordRef);
};

/**
 * Get records by document type
 */
export const getRecordsByType = async (
  userId: string,
  documentType: string
): Promise<MedicalRecord[]> => {
  const records = await getUserRecords(userId);
  return records.filter(r => r.analysis.documentType === documentType);
};

/**
 * Subscribe to records changes (real-time updates)
 * Returns an unsubscribe function
 */
export const subscribeToRecords = (
  userId: string,
  callback: (records: MedicalRecord[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const recordsRef = ref(database, `${PATHS.records}/${userId}`);
  
  const listener = onValue(
    recordsRef,
    (snapshot: DataSnapshot) => {
      const records: MedicalRecord[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          const record = childSnapshot.val();
          // Remove Firebase-specific fields
          const { userId: _, syncedAt: __, ...cleanRecord } = record;
          records.push(cleanRecord as MedicalRecord);
        });
      }
      callback(records.sort((a, b) => b.createdAt - a.createdAt));
    },
    (error) => {
      console.error('Firebase subscription error:', error);
      onError?.(error);
    }
  );
  
  // Return unsubscribe function
  return () => off(recordsRef, 'value', listener);
};

/**
 * Update medication proof image
 */
export const updateMedicationProof = async (
  userId: string,
  recordId: string,
  medicationName: string,
  proofImage: string
): Promise<void> => {
  const record = await getRecordById(userId, recordId);
  if (!record) {
    throw new Error('Record not found');
  }
  
  const updatedMedications = record.analysis.medications.map((med) =>
    med.name === medicationName
      ? { ...med, purchaseProofImage: proofImage }
      : med
  );
  
  await updateRecord(userId, recordId, {
    analysis: {
      ...record.analysis,
      medications: updatedMedications,
    },
  });
};

/**
 * Update pill count for a medication
 */
export const updateMedicationPillCount = async (
  userId: string,
  recordId: string,
  medicationName: string,
  pillsRemaining: number
): Promise<void> => {
  const record = await getRecordById(userId, recordId);
  if (!record) {
    throw new Error('Record not found');
  }
  
  const updatedMedications = record.analysis.medications.map((med) =>
    med.name === medicationName
      ? { ...med, pillsRemaining }
      : med
  );
  
  await updateRecord(userId, recordId, {
    analysis: {
      ...record.analysis,
      medications: updatedMedications,
    },
  });
};

/**
 * Save medication reminder
 */
export const saveMedicationReminder = async (
  userId: string,
  reminder: Omit<MedicationReminder, 'id'>
): Promise<string> => {
  const remindersRef = ref(database, `${PATHS.reminders}/${userId}`);
  const newReminderRef = push(remindersRef);
  
  const newReminder: MedicationReminder = {
    ...reminder,
    id: newReminderRef.key!,
  };
  
  await set(newReminderRef, newReminder);
  return newReminderRef.key!;
};

/**
 * Get all medication reminders for a user
 */
export const getUserReminders = async (userId: string): Promise<MedicationReminder[]> => {
  const remindersRef = ref(database, `${PATHS.reminders}/${userId}`);
  const snapshot = await get(remindersRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const reminders: MedicationReminder[] = [];
  snapshot.forEach((childSnapshot: DataSnapshot) => {
    reminders.push(childSnapshot.val() as MedicationReminder);
  });
  
  return reminders;
};

/**
 * Update a medication reminder
 */
export const updateReminder = async (
  userId: string,
  reminderId: string,
  updates: Partial<MedicationReminder>
): Promise<void> => {
  const reminderRef = ref(database, `${PATHS.reminders}/${userId}/${reminderId}`);
  await update(reminderRef, updates);
};

/**
 * Delete a medication reminder
 */
export const deleteReminder = async (
  userId: string,
  reminderId: string
): Promise<void> => {
  const reminderRef = ref(database, `${PATHS.reminders}/${userId}/${reminderId}`);
  await remove(reminderRef);
};

/**
 * Subscribe to reminders changes (real-time updates)
 */
export const subscribeToReminders = (
  userId: string,
  callback: (reminders: MedicationReminder[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const remindersRef = ref(database, `${PATHS.reminders}/${userId}`);
  
  const listener = onValue(
    remindersRef,
    (snapshot: DataSnapshot) => {
      const reminders: MedicationReminder[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          reminders.push(childSnapshot.val() as MedicationReminder);
        });
      }
      callback(reminders);
    },
    (error) => {
      console.error('Firebase reminders subscription error:', error);
      onError?.(error);
    }
  );
  
  // Return unsubscribe function
  return () => off(remindersRef, 'value', listener);
};

/**
 * Get user settings
 */
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const settingsRef = ref(database, `${PATHS.settings}/${userId}`);
  const snapshot = await get(settingsRef);
  return snapshot.exists() ? snapshot.val() as UserSettings : null;
};

/**
 * Save user settings
 */
export const saveUserSettings = async (
  userId: string,
  settings: UserSettings
): Promise<void> => {
  const settingsRef = ref(database, `${PATHS.settings}/${userId}`);
  await set(settingsRef, settings);
};

/**
 * Sync local records to Firebase (for migration from local storage)
 */
export const syncLocalRecordsToFirebase = async (
  userId: string,
  localRecords: MedicalRecord[]
): Promise<void> => {
  const existingRecords = await getUserRecords(userId);
  const existingIds = new Set(existingRecords.map(r => r.id));
  
  // Only sync records that don't exist in Firebase
  const newRecords = localRecords.filter(r => !existingIds.has(r.id));
  
  for (const record of newRecords) {
    await createRecord(userId, record);
  }
};
