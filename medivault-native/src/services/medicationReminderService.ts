/**
 * Medication Reminder Service
 * Background task for checking missed medications and sending notifications
 */

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, get } from "firebase/database";
import { database } from "../config/firebase";
import { getUserFamily, getFamilyMemberUserIds } from "./familyRequestService";
import { createMedicineMissedNotification } from "./notificationService";

const BACKGROUND_TASK_NAME = "MEDICATION_REMINDER_TASK";
const CURRENT_USER_KEY = "@medivault_current_user_id";

// Medication schedule times (in hours, 24-hour format)
const SCHEDULE_TIMES = {
  morning: 8, // 8:00 AM
  afternoon: 13, // 1:00 PM
  evening: 20, // 8:00 PM
};

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDateKey = (): string => {
  const date = new Date();
  return date.toISOString().split("T")[0];
};

/**
 * Check if a medication time has passed by more than 1 hour
 */
const isMedicationMissed = (
  timeSlot: "morning" | "afternoon" | "evening"
): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  const scheduledHour = SCHEDULE_TIMES[timeSlot];
  const missedThresholdHour = scheduledHour + 1;

  // Check if current time is past the missed threshold
  return currentHour >= missedThresholdHour;
};

/**
 * Get all medications for a user
 */
const getUserMedications = async (
  userId: string
): Promise<Array<{ name: string; sourceId: string }>> => {
  try {
    const recordsRef = ref(database, `records/${userId}`);
    const snapshot = await get(recordsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const medications: Array<{ name: string; sourceId: string }> = [];
    snapshot.forEach((childSnapshot) => {
      const record = childSnapshot.val();
      if (record.analysis?.medications) {
        record.analysis.medications.forEach((med: any) => {
          medications.push({
            name: med.name,
            sourceId: record.id,
          });
        });
      }
    });

    return medications;
  } catch (error) {
    console.error("Error getting user medications:", error);
    return [];
  }
};

/**
 * Get taken medications for today
 */
const getTakenMedicationsToday = async (
  userId: string,
  dateKey: string
): Promise<
  Array<{ medicationName: string; timeSlot: string; date: string }>
> => {
  try {
    const takenRef = ref(database, `takenMedications/${userId}`);
    const snapshot = await get(takenRef);

    if (!snapshot.exists()) {
      return [];
    }

    const takenMeds: Array<{
      medicationName: string;
      timeSlot: string;
      date: string;
    }> = [];

    snapshot.forEach((childSnapshot) => {
      const taken = childSnapshot.val();
      if (taken.date === dateKey) {
        takenMeds.push({
          medicationName: taken.medicationName,
          timeSlot: taken.timeSlot,
          date: taken.date,
        });
      }
    });

    return takenMeds;
  } catch (error) {
    console.error("Error getting taken medications:", error);
    return [];
  }
};

/**
 * Check for missed medications for a user and send notifications
 */
export const checkMissedMedications = async (userId: string): Promise<void> => {
  try {
    const dateKey = getTodayDateKey();
    const timeSlots: Array<"morning" | "afternoon" | "evening"> = [
      "morning",
      "afternoon",
      "evening",
    ];

    // Get all user medications
    const allMedications = await getUserMedications(userId);

    if (allMedications.length === 0) {
      console.log("No medications found for user");
      return;
    }

    // Get taken medications for today
    const takenMeds = await getTakenMedicationsToday(userId, dateKey);

    // Build list of missed medications
    const missedMedications: Array<{ name: string; timeSlot: string }> = [];

    for (const timeSlot of timeSlots) {
      // Check if this time slot has passed by more than 1 hour
      if (!isMedicationMissed(timeSlot)) {
        continue;
      }

      // Check each medication to see if it was taken for this time slot
      for (const med of allMedications) {
        const wasTaken = takenMeds.some(
          (taken) =>
            taken.medicationName === med.name && taken.timeSlot === timeSlot
        );

        if (!wasTaken) {
          missedMedications.push({
            name: med.name,
            timeSlot: timeSlot,
          });
        }
      }
    }

    // If there are missed medications, send notifications to all family members
    if (missedMedications.length > 0) {
      console.log(`Found ${missedMedications.length} missed medications`);

      // Get user's display name
      const userRef = ref(database, `users/${userId}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.exists() ? userSnapshot.val() : {};
      const userName = userData.displayName || "A family member";

      // Get user's family
      const family = await getUserFamily(userId);

      if (family) {
        // Get all family member IDs
        const familyMemberIds = await getFamilyMemberUserIds(family.id);

        // Send notification to ALL family members (including the person who missed)
        for (const memberId of familyMemberIds) {
          await createMedicineMissedNotification(
            memberId,
            userName,
            missedMedications
          );
        }

        console.log(
          `Sent missed medication notifications to ${familyMemberIds.length} family members`
        );
      }
    } else {
      console.log("No missed medications found");
    }
  } catch (error) {
    console.error("Error checking missed medications:", error);
  }
};

/**
 * Define the background task
 */
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    console.log("Background task: Checking missed medications...");

    // Get the current authenticated user ID from AsyncStorage
    const userId = await AsyncStorage.getItem(CURRENT_USER_KEY);

    if (!userId) {
      console.log("No authenticated user found");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Check for missed medications
    await checkMissedMedications(userId);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background fetch task
 */
export const registerBackgroundTask = async (): Promise<void> => {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_TASK_NAME
    );

    if (isRegistered) {
      console.log("Background task already registered");
      return;
    }

    // Register the task to run every hour
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 60 * 60, // 1 hour in seconds
      stopOnTerminate: false, // Continue after app is closed
      startOnBoot: true, // Start when device boots
    });

    console.log("Background task registered successfully");
  } catch (error) {
    console.error("Error registering background task:", error);
  }
};

/**
 * Unregister the background task
 */
export const unregisterBackgroundTask = async (): Promise<void> => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    console.log("Background task unregistered");
  } catch (error) {
    console.error("Error unregistering background task:", error);
  }
};

/**
 * Update the current user ID in storage (call this when user logs in)
 */
export const setCurrentUserId = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_USER_KEY, userId);
  } catch (error) {
    console.error("Error setting current user ID:", error);
  }
};

/**
 * Clear the current user ID (call this when user logs out)
 */
export const clearCurrentUserId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error("Error clearing current user ID:", error);
  }
};
