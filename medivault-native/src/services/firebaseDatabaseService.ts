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
import { MedicalRecord, Medication, TakenMedication, LabTestRecord, FamilyMember } from '../types';

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
  takenMedications: 'takenMedications',
  labTestRecords: 'labTestRecords',
  familyMembers: 'familyMembers',
};

/**
 * Helper function to remove undefined values from an object
 * Firebase Realtime Database does not accept undefined values
 */
const removeUndefinedValues = <T extends Record<string, any>>(obj: T): T => {
  const result = {} as T;
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

/**
 * Create or update a user profile
 */
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const userRef = ref(database, `${PATHS.users}/${profile.uid}`);
  
  // Remove undefined values before saving (Firebase doesn't accept undefined)
  const cleanProfile = removeUndefinedValues({
    ...profile,
    updatedAt: new Date().toISOString(),
  });
  
  await set(userRef, cleanProfile);
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
          // Ensure analysis arrays are initialized to prevent undefined errors
          if (cleanRecord.analysis) {
            cleanRecord.analysis.medications = cleanRecord.analysis.medications || [];
            cleanRecord.analysis.diagnosis = cleanRecord.analysis.diagnosis || [];
            cleanRecord.analysis.nextSteps = cleanRecord.analysis.nextSteps || [];
          }
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

// ==================== Family Members Functions ====================

/**
 * Create a new family member
 */
export const createFamilyMember = async (
  userId: string,
  member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const familyMembersRef = ref(database, `${PATHS.familyMembers}/${userId}`);
  const newMemberRef = push(familyMembersRef);
  
  const now = Date.now();
  const newMember: FamilyMember = {
    ...member,
    id: newMemberRef.key!,
    createdAt: now,
    updatedAt: now,
  };
  
  // Remove undefined values before saving
  const cleanMember = removeUndefinedValues(newMember);
  
  await set(newMemberRef, cleanMember);
  return newMemberRef.key!;
};

/**
 * Get all family members for a user
 */
export const getUserFamilyMembers = async (userId: string): Promise<FamilyMember[]> => {
  const familyMembersRef = ref(database, `${PATHS.familyMembers}/${userId}`);
  const snapshot = await get(familyMembersRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const members: FamilyMember[] = [];
  snapshot.forEach((childSnapshot: DataSnapshot) => {
    members.push(childSnapshot.val() as FamilyMember);
  });
  
  return members.sort((a, b) => {
    // Primary member first
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    // Then by creation date
    return a.createdAt - b.createdAt;
  });
};

/**
 * Get a single family member by ID
 */
export const getFamilyMemberById = async (
  userId: string,
  memberId: string
): Promise<FamilyMember | null> => {
  const memberRef = ref(database, `${PATHS.familyMembers}/${userId}/${memberId}`);
  const snapshot = await get(memberRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.val() as FamilyMember;
};

/**
 * Update a family member
 */
export const updateFamilyMember = async (
  userId: string,
  memberId: string,
  updates: Partial<FamilyMember>
): Promise<void> => {
  const memberRef = ref(database, `${PATHS.familyMembers}/${userId}/${memberId}`);
  
  const cleanUpdates = removeUndefinedValues({
    ...updates,
    updatedAt: Date.now(),
  });
  
  await update(memberRef, cleanUpdates);
};

/**
 * Delete a family member
 */
export const deleteFamilyMember = async (
  userId: string,
  memberId: string
): Promise<void> => {
  const memberRef = ref(database, `${PATHS.familyMembers}/${userId}/${memberId}`);
  await remove(memberRef);
};

/**
 * Subscribe to family members changes (real-time updates)
 */
export const subscribeToFamilyMembers = (
  userId: string,
  callback: (members: FamilyMember[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const familyMembersRef = ref(database, `${PATHS.familyMembers}/${userId}`);
  
  const listener = onValue(
    familyMembersRef,
    (snapshot: DataSnapshot) => {
      const members: FamilyMember[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          members.push(childSnapshot.val() as FamilyMember);
        });
      }
      // Sort: primary first, then by creation date
      const sortedMembers = members.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.createdAt - b.createdAt;
      });
      callback(sortedMembers);
    },
    (error) => {
      console.error('Firebase family members subscription error:', error);
      onError?.(error);
    }
  );
  
  // Return unsubscribe function
  return () => off(familyMembersRef, 'value', listener);
};

/**
 * Set a family member as primary and unset others
 */
export const setPrimaryFamilyMember = async (
  userId: string,
  memberId: string
): Promise<void> => {
  const members = await getUserFamilyMembers(userId);
  
  // Update all members
  for (const member of members) {
    await updateFamilyMember(userId, member.id, {
      isPrimary: member.id === memberId,
    });
  }
};

/**
 * Get the primary family member
 */
export const getPrimaryFamilyMember = async (
  userId: string
): Promise<FamilyMember | null> => {
  const members = await getUserFamilyMembers(userId);
  return members.find(m => m.isPrimary) || members[0] || null;
};

// ==================== Family Member Records Functions ====================
// These functions are modified versions that support family member filtering

/**
 * Create a medical record for a specific family member
 */
export const createRecordForMember = async (
  userId: string,
  memberId: string,
  record: MedicalRecord
): Promise<string> => {
  const recordRef = ref(database, `${PATHS.records}/${userId}/${memberId}/${record.id}`);
  
  await set(recordRef, {
    ...record,
    userId,
    memberId,
    syncedAt: new Date().toISOString(),
  });
  
  return record.id;
};

/**
 * Get all records for a specific family member
 */
export const getMemberRecords = async (
  userId: string,
  memberId: string
): Promise<MedicalRecord[]> => {
  const recordsRef = ref(database, `${PATHS.records}/${userId}/${memberId}`);
  const snapshot = await get(recordsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const records: MedicalRecord[] = [];
  snapshot.forEach((childSnapshot: DataSnapshot) => {
    const record = childSnapshot.val();
    const { userId: _, memberId: __, syncedAt: ___, ...cleanRecord } = record;
    records.push(cleanRecord as MedicalRecord);
  });
  
  return records.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Subscribe to records for a specific family member
 */
export const subscribeToMemberRecords = (
  userId: string,
  memberId: string,
  callback: (records: MedicalRecord[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const recordsRef = ref(database, `${PATHS.records}/${userId}/${memberId}`);
  
  const listener = onValue(
    recordsRef,
    (snapshot: DataSnapshot) => {
      const records: MedicalRecord[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          const record = childSnapshot.val();
          const { userId: _, memberId: __, syncedAt: ___, ...cleanRecord } = record;
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
  
  return () => off(recordsRef, 'value', listener);
};

/**
 * Delete a record for a specific family member
 */
export const deleteMemberRecord = async (
  userId: string,
  memberId: string,
  recordId: string
): Promise<void> => {
  const recordRef = ref(database, `${PATHS.records}/${userId}/${memberId}/${recordId}`);
  await remove(recordRef);
};

/**
 * Update a record for a specific family member
 */
export const updateMemberRecord = async (
  userId: string,
  memberId: string,
  recordId: string,
  updates: Partial<MedicalRecord>
): Promise<void> => {
  const recordRef = ref(database, `${PATHS.records}/${userId}/${memberId}/${recordId}`);
  await update(recordRef, {
    ...updates,
    syncedAt: new Date().toISOString(),
  });
};

/**
 * Update medication proof image
 * Now supports both old and new storage patterns
 */
export const updateMedicationProof = async (
  userId: string,
  recordId: string,
  medicationName: string,
  proofImage: string,
  memberId?: string
): Promise<void> => {
  // Try new pattern first if memberId provided
  let record: MedicalRecord | null = null;
  
  if (memberId) {
    const recordRef = ref(database, `${PATHS.records}/${userId}/${memberId}/${recordId}`);
    const snapshot = await get(recordRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const { userId: _, memberId: __, syncedAt: ___, ...cleanRecord } = data;
      record = cleanRecord as MedicalRecord;
    }
  }
  
  // Fall back to old pattern if not found
  if (!record) {
    record = await getRecordById(userId, recordId);
  }
  
  if (!record) {
    throw new Error('Record not found');
  }
  
  const updatedMedications = record.analysis.medications.map((med) =>
    med.name === medicationName
      ? { ...med, purchaseProofImage: proofImage }
      : med
  );
  
  // Update using the appropriate path
  if (memberId) {
    const recordRef = ref(database, `${PATHS.records}/${userId}/${memberId}/${recordId}`);
    await update(recordRef, {
      analysis: {
        ...record.analysis,
        medications: updatedMedications,
      },
      syncedAt: new Date().toISOString(),
    });
  } else {
    await updateRecord(userId, recordId, {
      analysis: {
        ...record.analysis,
        medications: updatedMedications,
      },
    });
  }
};

/**
 * Update pill count for a medication
 * Now supports both old and new storage patterns
 */
export const updateMedicationPillCount = async (
  userId: string,
  recordId: string,
  medicationName: string,
  pillsRemaining: number,
  memberId?: string
): Promise<void> => {
  // Try new pattern first if memberId provided
  let record: MedicalRecord | null = null;
  
  if (memberId) {
    const recordRef = ref(database, `${PATHS.records}/${userId}/${memberId}/${recordId}`);
    const snapshot = await get(recordRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const { userId: _, memberId: __, syncedAt: ___, ...cleanRecord } = data;
      record = cleanRecord as MedicalRecord;
    }
  }
  
  // Fall back to old pattern if not found
  if (!record) {
    record = await getRecordById(userId, recordId);
  }
  
  if (!record) {
    throw new Error('Record not found');
  }
  
  const updatedMedications = record.analysis.medications.map((med) =>
    med.name === medicationName
      ? { ...med, pillsRemaining }
      : med
  );
  
  // Update using the appropriate path
  if (memberId) {
    const recordRef = ref(database, `${PATHS.records}/${userId}/${memberId}/${recordId}`);
    await update(recordRef, {
      analysis: {
        ...record.analysis,
        medications: updatedMedications,
      },
      syncedAt: new Date().toISOString(),
    });
  } else {
    await updateRecord(userId, recordId, {
      analysis: {
        ...record.analysis,
        medications: updatedMedications,
      },
    });
  }
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

// ==================== Taken Medications Functions ====================

/**
 * Save a taken medication record
 */
export const saveTakenMedication = async (
  userId: string,
  takenMed: Omit<TakenMedication, 'id'>
): Promise<string> => {
  const takenMedsRef = ref(database, `${PATHS.takenMedications}/${userId}`);
  const newTakenMedRef = push(takenMedsRef);
  
  const newTakenMed: TakenMedication = {
    ...takenMed,
    id: newTakenMedRef.key!,
  };
  
  await set(newTakenMedRef, newTakenMed);
  return newTakenMedRef.key!;
};

/**
 * Get all taken medications for a user
 */
export const getUserTakenMedications = async (userId: string): Promise<TakenMedication[]> => {
  const takenMedsRef = ref(database, `${PATHS.takenMedications}/${userId}`);
  const snapshot = await get(takenMedsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const takenMeds: TakenMedication[] = [];
  snapshot.forEach((childSnapshot: DataSnapshot) => {
    takenMeds.push(childSnapshot.val() as TakenMedication);
  });
  
  return takenMeds.sort((a, b) => b.takenAt - a.takenAt);
};

/**
 * Get taken medications for a specific date
 */
export const getTakenMedicationsForDate = async (
  userId: string,
  date: string
): Promise<TakenMedication[]> => {
  const allTakenMeds = await getUserTakenMedications(userId);
  return allTakenMeds.filter(med => med.date === date);
};

/**
 * Subscribe to taken medications changes (real-time updates)
 */
export const subscribeToTakenMedications = (
  userId: string,
  callback: (takenMeds: TakenMedication[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const takenMedsRef = ref(database, `${PATHS.takenMedications}/${userId}`);
  
  const listener = onValue(
    takenMedsRef,
    (snapshot: DataSnapshot) => {
      const takenMeds: TakenMedication[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          takenMeds.push(childSnapshot.val() as TakenMedication);
        });
      }
      callback(takenMeds.sort((a, b) => b.takenAt - a.takenAt));
    },
    (error) => {
      console.error('Firebase taken medications subscription error:', error);
      onError?.(error);
    }
  );
  
  // Return unsubscribe function
  return () => off(takenMedsRef, 'value', listener);
};

/**
 * Delete a taken medication record (for undo functionality)
 */
export const deleteTakenMedication = async (
  userId: string,
  takenMedId: string
): Promise<void> => {
  const takenMedRef = ref(database, `${PATHS.takenMedications}/${userId}/${takenMedId}`);
  await remove(takenMedRef);
};

/**
 * Check if a medication has been taken for a specific date and time slot
 */
export const isMedicationTakenForSlot = async (
  userId: string,
  medicationName: string,
  timeSlot: string,
  date: string
): Promise<boolean> => {
  const takenMeds = await getTakenMedicationsForDate(userId, date);
  return takenMeds.some(
    med => med.medicationName === medicationName && med.timeSlot === timeSlot
  );
};

// ==================== Lab Test Records Functions ====================

/**
 * Create a new lab test record
 */
export const createLabTestRecord = async (
  userId: string,
  record: LabTestRecord
): Promise<string> => {
  const recordRef = ref(database, `${PATHS.labTestRecords}/${userId}/${record.id}`);
  
  await set(recordRef, {
    ...record,
    userId,
    syncedAt: new Date().toISOString(),
  });
  
  return record.id;
};

/**
 * Get all lab test records for a user
 */
export const getUserLabTestRecords = async (userId: string): Promise<LabTestRecord[]> => {
  const recordsRef = ref(database, `${PATHS.labTestRecords}/${userId}`);
  const snapshot = await get(recordsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const records: LabTestRecord[] = [];
  snapshot.forEach((childSnapshot: DataSnapshot) => {
    const record = childSnapshot.val();
    // Remove Firebase-specific fields
    const { userId: _, syncedAt: __, ...cleanRecord } = record;
    records.push(cleanRecord as LabTestRecord);
  });
  
  return records.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Get a single lab test record by ID
 */
export const getLabTestRecordById = async (
  userId: string,
  recordId: string
): Promise<LabTestRecord | null> => {
  const recordRef = ref(database, `${PATHS.labTestRecords}/${userId}/${recordId}`);
  const snapshot = await get(recordRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const record = snapshot.val();
  const { userId: _, syncedAt: __, ...cleanRecord } = record;
  return cleanRecord as LabTestRecord;
};

/**
 * Update a lab test record
 */
export const updateLabTestRecord = async (
  userId: string,
  recordId: string,
  updates: Partial<LabTestRecord>
): Promise<void> => {
  const recordRef = ref(database, `${PATHS.labTestRecords}/${userId}/${recordId}`);
  await update(recordRef, {
    ...updates,
    syncedAt: new Date().toISOString(),
  });
};

/**
 * Delete a lab test record
 */
export const deleteLabTestRecord = async (
  userId: string,
  recordId: string
): Promise<void> => {
  const recordRef = ref(database, `${PATHS.labTestRecords}/${userId}/${recordId}`);
  await remove(recordRef);
};

/**
 * Subscribe to lab test records changes (real-time updates)
 */
export const subscribeToLabTestRecords = (
  userId: string,
  callback: (records: LabTestRecord[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const recordsRef = ref(database, `${PATHS.labTestRecords}/${userId}`);
  
  const listener = onValue(
    recordsRef,
    (snapshot: DataSnapshot) => {
      const records: LabTestRecord[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          const record = childSnapshot.val();
          // Remove Firebase-specific fields
          const { userId: _, syncedAt: __, ...cleanRecord } = record;
          // Ensure analysis arrays are initialized to prevent undefined errors
          if (cleanRecord.analysis) {
            cleanRecord.analysis.testCategories = cleanRecord.analysis.testCategories || [];
            cleanRecord.analysis.keyFindings = cleanRecord.analysis.keyFindings || [];
            cleanRecord.analysis.recommendations = cleanRecord.analysis.recommendations || [];
          }
          records.push(cleanRecord as LabTestRecord);
        });
      }
      callback(records.sort((a, b) => b.createdAt - a.createdAt));
    },
    (error) => {
      console.error('Firebase lab test records subscription error:', error);
      onError?.(error);
    }
  );
  
  // Return unsubscribe function
  return () => off(recordsRef, 'value', listener);
};
