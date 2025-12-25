/**
 * MediVault AI - Record Store
 * Zustand store for managing medical records state with Firebase integration
 */

import { create } from "zustand";
import {
  MedicalRecord,
  MedicationWithSource,
  Medication,
  TakenMedication,
  LabTestRecord,
} from "../types";
import {
  subscribeToRecords,
  createRecord,
  deleteRecord as firebaseDeleteRecord,
  updateRecord as firebaseUpdateRecord,
  updateMedicationProof as firebaseUpdateMedicationProof,
  updateMedicationPillCount,
  syncLocalRecordsToFirebase,
  getUserRecords,
  subscribeToTakenMedications,
  saveTakenMedication,
  getUserTakenMedications,
  subscribeToLabTestRecords,
  createLabTestRecord,
  deleteLabTestRecord as firebaseDeleteLabTestRecord,
  getUserLabTestRecords,
} from "../services/firebaseDatabaseService";
import { storageService } from "../services/storageService";

// Initialization guards to prevent infinite loops
let isInitializing = false;
let currentViewingUserId: string | null = null;

/**
 * Record store state interface
 */
interface RecordState {
  // Data
  records: MedicalRecord[];
  selectedRecord: MedicalRecord | null;
  takenMedications: TakenMedication[];
  labTestRecords: LabTestRecord[];

  // User context
  userId: string | null;

  // Loading states
  isLoading: boolean;
  isAnalyzing: boolean;
  isSyncing: boolean;
  error: string | null;

  // Subscription management
  unsubscribe: (() => void) | null;
  unsubscribeTakenMeds: (() => void) | null;
  unsubscribeLabTests: (() => void) | null;

  // Actions
  initializeWithUser: (userId: string) => Promise<void>;
  switchToProfile: (targetUserId: string) => Promise<void>;
  cleanup: () => void;
  loadRecords: () => Promise<void>;
  addRecord: (record: MedicalRecord) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  updateRecord: (
    recordId: string,
    updates: Partial<MedicalRecord>
  ) => Promise<void>;
  setSelectedRecord: (record: MedicalRecord | null) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  updateMedicationProof: (
    recordId: string,
    medicationName: string,
    proofImage: string
  ) => Promise<void>;
  decrementPillCount: (
    recordId: string,
    medicationName: string
  ) => Promise<void>;
  syncLocalData: () => Promise<void>;

  // Taken medications actions
  markMedicationTaken: (
    medication: MedicationWithSource,
    timeSlot: "morning" | "afternoon" | "evening",
    date: string
  ) => Promise<void>;
  isMedicationTaken: (
    medicationName: string,
    timeSlot: string,
    date: string
  ) => boolean;
  getTakenMedicationsForDate: (date: string) => TakenMedication[];

  // Lab test records actions
  addLabTestRecord: (record: LabTestRecord) => Promise<void>;
  deleteLabTestRecord: (recordId: string) => Promise<void>;
  getLabTestRecordById: (id: string) => LabTestRecord | undefined;

  // Computed getters
  getLabReports: () => MedicalRecord[];
  getAllMedications: () => MedicationWithSource[];
  getRecordById: (id: string) => MedicalRecord | undefined;
  getStats: () => {
    totalRecords: number;
    labReports: number;
    labTestRecords: number;
    totalMedications: number;
  };
}

/**
 * Main record store with Firebase integration
 */
export const useRecordStore = create<RecordState>((set, get) => ({
  // Initial state
  records: [],
  selectedRecord: null,
  takenMedications: [],
  labTestRecords: [],
  userId: null,
  isLoading: false,
  isAnalyzing: false,
  isSyncing: false,
  error: null,
  unsubscribe: null,
  unsubscribeTakenMeds: null,
  unsubscribeLabTests: null,

  /**
   * Initialize store with authenticated user and subscribe to real-time updates
   */
  initializeWithUser: async (userId: string) => {
    // Use the userId parameter directly - no cross-store dependencies
    const viewingUserId = userId;

    // Prevent re-initialization if already initializing or if viewing profile hasn't changed
    if (isInitializing) {
      console.log("Already initializing, skipping...");
      return;
    }

    if (currentViewingUserId === viewingUserId) {
      console.log("Viewing profile unchanged, skipping reinitialize");
      return;
    }

    isInitializing = true;
    currentViewingUserId = viewingUserId;

    const {
      unsubscribe: existingUnsubscribe,
      unsubscribeTakenMeds: existingTakenMedsUnsubscribe,
      unsubscribeLabTests: existingLabTestsUnsubscribe,
    } = get();

    // Cleanup existing subscriptions if any
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }
    if (existingTakenMedsUnsubscribe) {
      existingTakenMedsUnsubscribe();
    }
    if (existingLabTestsUnsubscribe) {
      existingLabTestsUnsubscribe();
    }

    set({ isLoading: true, userId, error: null });

    try {
      // First, sync any local data to Firebase
      await get().syncLocalData();

      // Subscribe to real-time updates from Firebase for records
      // Use viewingUserId to load the correct user's data
      const unsubscribe = subscribeToRecords(
        viewingUserId,
        (records) => {
          set({ records, isLoading: false });
        },
        (error) => {
          console.error("Firebase subscription error:", error);
          set({
            error: "Failed to sync with cloud. Working offline.",
            isLoading: false,
          });
        }
      );

      // Subscribe to real-time updates from Firebase for taken medications
      const unsubscribeTakenMeds = subscribeToTakenMedications(
        userId,
        (takenMedications) => {
          set({ takenMedications });
        },
        (error) => {
          console.error(
            "Firebase taken medications subscription error:",
            error
          );
        }
      );

      // Subscribe to real-time updates from Firebase for lab test records
      const unsubscribeLabTests = subscribeToLabTestRecords(
        userId,
        (labTestRecords) => {
          set({ labTestRecords });
        },
        (error) => {
          console.error("Firebase lab test records subscription error:", error);
        }
      );

      set({ unsubscribe, unsubscribeTakenMeds, unsubscribeLabTests });
    } catch (error) {
      console.error("Error initializing records:", error);
      set({
        isLoading: false,
        error: "Failed to initialize records",
      });
    } finally {
      isInitializing = false;
    }
  },

  /**
   * Switch to viewing a different user's profile
   * Explicitly reinitializes with a different user ID
   */
  switchToProfile: async (targetUserId: string) => {
    // Reset guards to allow reinitialization
    currentViewingUserId = null;
    isInitializing = false;

    // Reinitialize with the target user's data
    await get().initializeWithUser(targetUserId);
  },

  /**
   * Cleanup subscriptions (call on logout)
   */
  cleanup: () => {
    const { unsubscribe, unsubscribeTakenMeds, unsubscribeLabTests } = get();
    if (unsubscribe) {
      unsubscribe();
    }
    if (unsubscribeTakenMeds) {
      unsubscribeTakenMeds();
    }
    if (unsubscribeLabTests) {
      unsubscribeLabTests();
    }
    set({
      records: [],
      selectedRecord: null,
      takenMedications: [],
      labTestRecords: [],
      userId: null,
      unsubscribe: null,
      unsubscribeTakenMeds: null,
      unsubscribeLabTests: null,
      error: null,
    });
  },

  /**
   * Load records manually (for refresh)
   */
  loadRecords: async () => {
    const { userId } = get();

    if (!userId) {
      set({ error: "User not authenticated" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const records = await getUserRecords(userId);
      set({ records, isLoading: false });
    } catch (error) {
      console.error("Error loading records:", error);
      set({
        isLoading: false,
        error: "Failed to load records",
      });
    }
  },

  /**
   * Add a new record to Firebase
   */
  addRecord: async (record) => {
    const { userId } = get();

    if (!userId) {
      set({ error: "User not authenticated" });
      throw new Error("User not authenticated");
    }

    try {
      // Save to Firebase - real-time subscription will update the store
      await createRecord(userId, record);

      // Also save to local storage as backup
      await storageService.saveRecord(record);

      set({ error: null });
    } catch (error) {
      console.error("Error adding record:", error);
      set({ error: "Failed to save record" });
      throw error;
    }
  },

  /**
   * Delete a record from Firebase
   */
  deleteRecord: async (recordId) => {
    const { userId } = get();

    if (!userId) {
      set({ error: "User not authenticated" });
      throw new Error("User not authenticated");
    }

    try {
      // Delete from Firebase - real-time subscription will update the store
      await firebaseDeleteRecord(userId, recordId);

      // Also delete from local storage
      await storageService.deleteRecord(recordId);

      // Clear selected record if it was deleted
      const { selectedRecord } = get();
      if (selectedRecord?.id === recordId) {
        set({ selectedRecord: null });
      }

      set({ error: null });
    } catch (error) {
      console.error("Error deleting record:", error);
      set({ error: "Failed to delete record" });
      throw error;
    }
  },

  /**
   * Update a record in Firebase
   */
  updateRecord: async (recordId, updates) => {
    const { userId } = get();

    if (!userId) {
      set({ error: "User not authenticated" });
      throw new Error("User not authenticated");
    }

    try {
      // Update in Firebase - real-time subscription will update the store
      await firebaseUpdateRecord(userId, recordId, updates);

      // Also update local storage
      await storageService.updateRecord(recordId, updates);

      set({ error: null });
    } catch (error) {
      console.error("Error updating record:", error);
      set({ error: "Failed to update record" });
      throw error;
    }
  },

  // Set selected record
  setSelectedRecord: (record) => {
    set({ selectedRecord: record });
  },

  // Set analyzing state
  setAnalyzing: (isAnalyzing) => {
    set({ isAnalyzing });
  },

  // Set error
  setError: (error) => {
    set({ error });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  /**
   * Update medication proof image in Firebase
   */
  updateMedicationProof: async (recordId, medicationName, proofImage) => {
    const { userId } = get();

    if (!userId) {
      set({ error: "User not authenticated" });
      throw new Error("User not authenticated");
    }

    try {
      // Get active family member ID from family store
      const { useFamilyStore } = require("./useFamilyStore");
      const activeMember = useFamilyStore.getState().activeMember;
      const memberId = activeMember?.id;

      // Update in Firebase - real-time subscription will update the store
      await firebaseUpdateMedicationProof(
        userId,
        recordId,
        medicationName,
        proofImage,
        memberId
      );

      // Also update local storage
      await storageService.updateMedicationProof(
        recordId,
        medicationName,
        proofImage
      );

      set({ error: null });
    } catch (error) {
      console.error("Error updating medication proof:", error);
      set({ error: "Failed to save proof image" });
      throw error;
    }
  },

  /**
   * Decrement pill count for a medication (when taken)
   */
  decrementPillCount: async (recordId, medicationName) => {
    const { userId, records } = get();

    console.log("🔍 DEBUG decrementPillCount:");
    console.log("  - recordId:", recordId);
    console.log("  - medicationName:", medicationName);
    console.log("  - userId:", userId);
    console.log("  - currentViewingUserId:", currentViewingUserId);
    console.log("  - records.length:", records.length);
    console.log(
      "  - records:",
      records.map((r) => r.id)
    );

    if (!userId) {
      set({ error: "User not authenticated" });
      throw new Error("User not authenticated");
    }

    try {
      // Get active family member ID from family store
      const { useFamilyStore } = require("./useFamilyStore");
      const activeMember = useFamilyStore.getState().activeMember;
      const memberId = activeMember?.id;

      // Find the record and medication to calculate new count
      // First try to find in current records
      let record = records.find((r) => r.id === recordId);

      // If not found, fetch from Firebase (viewing another profile)
      if (!record) {
        console.log("Record not in current view, fetching from Firebase...");

        // Use the viewing user ID (from global tracker)
        const viewingUserId = currentViewingUserId || userId;
        const allRecords = await getUserRecords(viewingUserId);
        record = allRecords.find((r) => r.id === recordId);

        if (!record) {
          throw new Error("Record not found in Firebase");
        }
      }

      const medication = record.analysis.medications.find(
        (m) => m.name === medicationName
      );
      if (!medication) {
        throw new Error("Medication not found");
      }

      const totalPills = medication.totalPills || 30;
      const currentRemaining = medication.pillsRemaining ?? totalPills;
      const newRemaining = Math.max(0, currentRemaining - 1);

      // Update in Firebase with memberId support
      // Use the viewing user ID to update the correct profile
      const targetUserId = currentViewingUserId || userId;
      await updateMedicationPillCount(
        targetUserId,
        recordId,
        medicationName,
        newRemaining,
        memberId
      );

      // Also update local storage (non-blocking)
      try {
        const updatedRecord = {
          ...record,
          analysis: {
            ...record.analysis,
            medications: record.analysis.medications.map((med) =>
              med.name === medicationName
                ? { ...med, totalPills, pillsRemaining: newRemaining }
                : med
            ),
          },
        };
        await storageService.updateRecord(recordId, updatedRecord);
      } catch (storageError: any) {
        // Local storage update failed, but that's OK
        // Firebase is the source of truth anyway
        console.log("Local storage update skipped:", storageError.message);
      }

      set({ error: null });
    } catch (error) {
      console.error("Error updating pill count:", error);
      set({ error: "Failed to update pill count" });
      throw error;
    }
  },

  /**
   * Sync local data to Firebase (migration helper)
   */
  syncLocalData: async () => {
    const { userId } = get();

    if (!userId) {
      return;
    }

    set({ isSyncing: true });

    try {
      // Get local records
      const localRecords = await storageService.getRecords();

      if (localRecords.length > 0) {
        // Sync to Firebase
        await syncLocalRecordsToFirebase(userId, localRecords);
      }

      set({ isSyncing: false });
    } catch (error) {
      console.error("Error syncing local data:", error);
      set({ isSyncing: false });
    }
  },

  // Get all lab reports
  getLabReports: () => {
    return get().records.filter(
      (r) => r.analysis.documentType === "Lab Report"
    );
  },

  // Get all medications from all records
  getAllMedications: () => {
    return get().records.flatMap((record) =>
      (record.analysis.medications || []).map((med) => ({
        ...med,
        sourceId: record.id,
        sourceDate: record.analysis.date,
      }))
    );
  },

  // Get record by ID
  getRecordById: (id) => {
    return get().records.find((r) => r.id === id);
  },

  // Get statistics
  getStats: () => {
    const { records, labTestRecords } = get();
    return {
      totalRecords: records.length,
      labReports: records.filter(
        (r) => r.analysis.documentType === "Lab Report"
      ).length,
      labTestRecords: labTestRecords.length,
      totalMedications: records.reduce(
        (acc, r) => acc + (r.analysis.medications || []).length,
        0
      ),
    };
  },

  // ==================== Taken Medications Actions ====================

  /**
   * Mark a medication as taken for a specific time slot and date
   */
  markMedicationTaken: async (medication, timeSlot, date) => {
    const { userId } = get();

    if (!userId) {
      set({ error: "User not authenticated" });
      throw new Error("User not authenticated");
    }

    try {
      // Save to Firebase - subscription will update the store
      await saveTakenMedication(userId, {
        medicationName: medication.name,
        timeSlot,
        date,
        takenAt: Date.now(),
        sourceId: medication.sourceId,
        dosage: medication.dosage,
      });

      // Also decrement pill count
      await get().decrementPillCount(medication.sourceId, medication.name);

      // Send notifications to family members
      try {
        const {
          getUserFamily,
          getFamilyMemberUserIds,
        } = require("../services/familyRequestService");
        const {
          createMedicineTakenNotification,
        } = require("../services/notificationService");
        const { ref, get: firebaseGet } = require("firebase/database");
        const { database } = require("../config/firebase");

        // Get user's display name
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await firebaseGet(userRef);
        const userData = userSnapshot.exists() ? userSnapshot.val() : {};
        const takerName = userData.displayName || "A family member";

        // Get user's family
        const family = await getUserFamily(userId);
        if (family) {
          // Get all family member IDs
          const familyMemberIds = await getFamilyMemberUserIds(family.id);

          // Send notification to all family members EXCEPT the person who took it
          for (const memberId of familyMemberIds) {
            if (memberId !== userId) {
              await createMedicineTakenNotification(
                memberId,
                takerName,
                medication.name,
                medication.dosage || "Unknown dosage",
                timeSlot
              );
            }
          }
        }
      } catch (notifError) {
        console.error("Error sending family notifications:", notifError);
        // Don't throw - notification failure shouldn't prevent marking as taken
      }

      set({ error: null });
    } catch (error) {
      console.error("Error marking medication as taken:", error);
      set({ error: "Failed to save medication intake" });
      throw error;
    }
  },

  /**
   * Check if a medication has been taken for a specific time slot and date
   */
  isMedicationTaken: (medicationName, timeSlot, date) => {
    const { takenMedications } = get();
    return takenMedications.some(
      (taken) =>
        taken.medicationName === medicationName &&
        taken.timeSlot === timeSlot &&
        taken.date === date
    );
  },

  /**
   * Get all taken medications for a specific date
   */
  getTakenMedicationsForDate: (date) => {
    const { takenMedications } = get();
    return takenMedications.filter((taken) => taken.date === date);
  },

  // ==================== Lab Test Records Actions ====================

  /**
   * Add a new lab test record to Firebase
   */
  addLabTestRecord: async (record) => {
    const { userId } = get();

    if (!userId) {
      set({ error: "User not authenticated" });
      throw new Error("User not authenticated");
    }

    try {
      // Save to Firebase - real-time subscription will update the store
      await createLabTestRecord(userId, record);
      set({ error: null });
    } catch (error) {
      console.error("Error adding lab test record:", error);
      set({ error: "Failed to save lab test record" });
      throw error;
    }
  },

  /**
   * Delete a lab test record from Firebase
   */
  deleteLabTestRecord: async (recordId) => {
    const { userId } = get();

    if (!userId) {
      set({ error: "User not authenticated" });
      throw new Error("User not authenticated");
    }

    try {
      // Delete from Firebase - real-time subscription will update the store
      await firebaseDeleteLabTestRecord(userId, recordId);
      set({ error: null });
    } catch (error) {
      console.error("Error deleting lab test record:", error);
      set({ error: "Failed to delete lab test record" });
      throw error;
    }
  },

  /**
   * Get a lab test record by ID
   */
  getLabTestRecordById: (id) => {
    return get().labTestRecords.find((r) => r.id === id);
  },
}));

export default useRecordStore;
