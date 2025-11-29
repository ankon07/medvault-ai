/**
 * MediVault AI - Calendar Service
 * Integration with device calendar for medication reminders
 */

import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { Medication } from '../types';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Calendar event data for medication
 */
export interface MedicationCalendarEvent {
  medication: Medication;
  startDate: Date;
  endDate: Date;
  reminderMinutesBefore: number;
}

/**
 * Result of calendar permission request
 */
export interface CalendarPermissionResult {
  granted: boolean;
  calendarId?: string;
  error?: string;
}

/**
 * Result of event creation
 */
export interface EventCreationResult {
  success: boolean;
  eventId?: string;
  notificationId?: string;
  error?: string;
}

/**
 * Request calendar permissions from the user
 * @returns Promise resolving to permission result
 */
export const requestCalendarPermission = async (): Promise<CalendarPermissionResult> => {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    
    if (status !== 'granted') {
      return {
        granted: false,
        error: 'Calendar permission was denied. Please enable it in settings to add medication reminders.',
      };
    }

    // Also request notification permissions
    const notificationPermission = await Notifications.requestPermissionsAsync();
    if (!notificationPermission.granted) {
      console.warn('Notification permission denied, reminders may not work properly');
    }

    // Get or create MediVault calendar
    const calendarId = await getOrCreateMediVaultCalendar();
    
    return {
      granted: true,
      calendarId,
    };
  } catch (error) {
    console.error('Calendar permission error:', error);
    return {
      granted: false,
      error: 'Failed to request calendar permission. Please try again.',
    };
  }
};

/**
 * Check if calendar permission is granted
 * @returns Promise resolving to boolean
 */
export const checkCalendarPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking calendar permission:', error);
    return false;
  }
};

/**
 * Get or create a dedicated MediVault calendar
 * @returns Promise resolving to calendar ID
 */
const getOrCreateMediVaultCalendar = async (): Promise<string> => {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  
  // Look for existing MediVault calendar
  const existingCalendar = calendars.find(
    (cal) => cal.title === 'MediVault Medications'
  );
  
  if (existingCalendar) {
    return existingCalendar.id;
  }

  // Create new calendar
  const defaultCalendarSource = Platform.OS === 'ios'
    ? await getDefaultCalendarSource()
    : { isLocalAccount: true, name: 'MediVault', type: Calendar.CalendarType.LOCAL };

  const newCalendarId = await Calendar.createCalendarAsync({
    title: 'MediVault Medications',
    color: '#0D9488', // Primary teal color
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultCalendarSource.id,
    source: defaultCalendarSource as any,
    name: 'MediVault',
    ownerAccount: 'MediVault',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });

  return newCalendarId;
};

/**
 * Get default calendar source for iOS
 */
const getDefaultCalendarSource = async () => {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendar = calendars.find(
    (cal) => cal.source.name === 'Default' || cal.source.name === 'iCloud'
  );
  return defaultCalendar?.source || calendars[0]?.source;
};

/**
 * Parse medication frequency to get time slots
 * @param frequency - Frequency string from prescription
 * @returns Array of hour values (24-hour format)
 */
const parseFrequencyToTimeSlots = (frequency: string): number[] => {
  const lowerFreq = frequency.toLowerCase();
  
  // Common frequency patterns
  if (lowerFreq.includes('once') || lowerFreq.includes('1 time') || lowerFreq.includes('daily')) {
    return [8]; // 8 AM
  }
  
  if (lowerFreq.includes('twice') || lowerFreq.includes('2 times') || lowerFreq.includes('bid')) {
    return [8, 20]; // 8 AM and 8 PM
  }
  
  if (lowerFreq.includes('three') || lowerFreq.includes('3 times') || lowerFreq.includes('tid')) {
    return [8, 14, 20]; // 8 AM, 2 PM, 8 PM
  }
  
  if (lowerFreq.includes('four') || lowerFreq.includes('4 times') || lowerFreq.includes('qid')) {
    return [8, 12, 16, 20]; // 8 AM, 12 PM, 4 PM, 8 PM
  }
  
  if (lowerFreq.includes('every 4 hour')) {
    return [6, 10, 14, 18, 22]; // Every 4 hours
  }
  
  if (lowerFreq.includes('every 6 hour')) {
    return [6, 12, 18, 24]; // Every 6 hours
  }
  
  if (lowerFreq.includes('every 8 hour')) {
    return [8, 16, 24]; // Every 8 hours
  }
  
  if (lowerFreq.includes('every 12 hour')) {
    return [8, 20]; // Every 12 hours
  }
  
  if (lowerFreq.includes('morning') || lowerFreq.includes('breakfast')) {
    return [8];
  }
  
  if (lowerFreq.includes('afternoon') || lowerFreq.includes('lunch')) {
    return [13];
  }
  
  if (lowerFreq.includes('evening') || lowerFreq.includes('dinner') || lowerFreq.includes('night')) {
    return [20];
  }
  
  if (lowerFreq.includes('bedtime') || lowerFreq.includes('before sleep')) {
    return [22];
  }
  
  // Default to morning
  return [8];
};

/**
 * Parse duration string to number of days
 * @param duration - Duration string from prescription
 * @returns Number of days
 */
const parseDurationToDays = (duration?: string): number => {
  if (!duration) return 7; // Default to 7 days
  
  const lowerDuration = duration.toLowerCase();
  
  // Extract number
  const numberMatch = lowerDuration.match(/(\d+)/);
  const num = numberMatch ? parseInt(numberMatch[1], 10) : 1;
  
  if (lowerDuration.includes('week')) {
    return num * 7;
  }
  
  if (lowerDuration.includes('month')) {
    return num * 30;
  }
  
  if (lowerDuration.includes('day')) {
    return num;
  }
  
  // If just a number, assume days
  if (numberMatch) {
    return num;
  }
  
  return 7; // Default
};

/**
 * Create calendar events for a medication
 * @param medication - Medication data
 * @param calendarId - Calendar ID to add events to
 * @returns Promise resolving to array of event creation results
 */
export const createMedicationEvents = async (
  medication: Medication,
  calendarId: string
): Promise<EventCreationResult[]> => {
  const results: EventCreationResult[] = [];
  const timeSlots = parseFrequencyToTimeSlots(medication.frequency);
  const durationDays = parseDurationToDays(medication.duration);
  
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  for (let day = 0; day < durationDays; day++) {
    for (const hour of timeSlots) {
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + day);
      eventDate.setHours(hour, 0, 0, 0);
      
      // Skip past events
      if (eventDate < new Date()) {
        continue;
      }
      
      const result = await createSingleMedicationEvent(
        medication,
        calendarId,
        eventDate
      );
      results.push(result);
    }
  }
  
  return results;
};

/**
 * Create a single calendar event with notification
 * @param medication - Medication data
 * @param calendarId - Calendar ID
 * @param eventDate - Date and time for the event
 * @returns Promise resolving to event creation result
 */
const createSingleMedicationEvent = async (
  medication: Medication,
  calendarId: string,
  eventDate: Date
): Promise<EventCreationResult> => {
  try {
    const endDate = new Date(eventDate);
    endDate.setMinutes(endDate.getMinutes() + 15); // 15-minute event duration
    
    const eventTitle = `💊 ${medication.name} - ${medication.dosage}`;
    const eventNotes = [
      `Medication: ${medication.name}`,
      `Dosage: ${medication.dosage}`,
      `Frequency: ${medication.frequency}`,
      medication.purpose ? `Purpose: ${medication.purpose}` : '',
      medication.sideEffects ? `Note: ${medication.sideEffects}` : '',
      '\nRemember to take your medication with water.',
    ].filter(Boolean).join('\n');
    
    // Create calendar event with alarm
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: eventTitle,
      notes: eventNotes,
      startDate: eventDate,
      endDate: endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: [
        { relativeOffset: -30 }, // 30 minutes before
      ],
    });
    
    // Schedule local notification 30 minutes before
    const notificationDate = new Date(eventDate);
    notificationDate.setMinutes(notificationDate.getMinutes() - 30);
    
    // Only schedule notification if it's in the future
    let notificationId: string | undefined;
    if (notificationDate > new Date()) {
      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medication Reminder',
          body: `Time to take ${medication.name} (${medication.dosage}) in 30 minutes`,
          data: { medicationName: medication.name, eventDate: eventDate.toISOString() },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
        },
      });
    }
    
    return {
      success: true,
      eventId,
      notificationId,
    };
  } catch (error) {
    console.error('Error creating medication event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create event',
    };
  }
};

/**
 * Add all medications from a prescription to calendar
 * @param medications - Array of medications from prescription
 * @returns Promise resolving to summary of created events
 */
export const addPrescriptionToCalendar = async (
  medications: Medication[]
): Promise<{ 
  success: boolean; 
  eventsCreated: number; 
  errors: string[];
  calendarId?: string;
}> => {
  const errors: string[] = [];
  let eventsCreated = 0;
  
  // Request permission first
  const permissionResult = await requestCalendarPermission();
  
  if (!permissionResult.granted || !permissionResult.calendarId) {
    return {
      success: false,
      eventsCreated: 0,
      errors: [permissionResult.error || 'Calendar permission not granted'],
    };
  }
  
  const calendarId = permissionResult.calendarId;
  
  // Create events for each medication
  for (const medication of medications) {
    const results = await createMedicationEvents(medication, calendarId);
    
    for (const result of results) {
      if (result.success) {
        eventsCreated++;
      } else if (result.error) {
        errors.push(`${medication.name}: ${result.error}`);
      }
    }
  }
  
  return {
    success: errors.length === 0,
    eventsCreated,
    errors,
    calendarId,
  };
};

/**
 * Show confirmation dialog and add medications to calendar
 * @param medications - Array of medications from prescription
 * @returns Promise resolving to boolean indicating success
 */
export const promptAndAddToCalendar = async (
  medications: Medication[]
): Promise<boolean> => {
  return new Promise((resolve) => {
    const medicationList = medications.map((m) => `• ${m.name}`).join('\n');
    
    Alert.alert(
      '📅 Add to Calendar',
      `Would you like to add medication reminders to your calendar?\n\nMedications:\n${medicationList}\n\nYou'll receive reminders 30 minutes before each dose.`,
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Add Reminders',
          onPress: async () => {
            const result = await addPrescriptionToCalendar(medications);
            
            if (result.success && result.eventsCreated > 0) {
              Alert.alert(
                '✅ Reminders Added',
                `Successfully added ${result.eventsCreated} medication reminders to your calendar. You'll be notified 30 minutes before each dose.`,
                [{ text: 'Great!' }]
              );
              resolve(true);
            } else if (result.eventsCreated > 0) {
              Alert.alert(
                '⚠️ Partially Added',
                `Added ${result.eventsCreated} reminders, but some failed:\n${result.errors.join('\n')}`,
                [{ text: 'OK' }]
              );
              resolve(true);
            } else {
              Alert.alert(
                '❌ Failed',
                result.errors[0] || 'Failed to add reminders. Please try again.',
                [{ text: 'OK' }]
              );
              resolve(false);
            }
          },
        },
      ]
    );
  });
};

/**
 * Cancel all scheduled notifications for a medication
 * @param medicationName - Name of the medication
 */
export const cancelMedicationNotifications = async (medicationName: string): Promise<void> => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.medicationName === medicationName) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

/**
 * Get all scheduled medication notifications
 * @returns Promise resolving to array of scheduled notifications
 */
export const getScheduledMedicationNotifications = async () => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return scheduledNotifications.filter(
      (n) => n.content.data?.medicationName
    );
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

export default {
  requestCalendarPermission,
  checkCalendarPermission,
  addPrescriptionToCalendar,
  promptAndAddToCalendar,
  createMedicationEvents,
  cancelMedicationNotifications,
  getScheduledMedicationNotifications,
};
