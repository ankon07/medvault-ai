/**
 * MediVault AI - Type Definitions
 * Core TypeScript interfaces for the application
 */

/**
 * Medication information extracted from medical documents
 */
export interface Medication {
  /** Name of the medication */
  name: string;
  /** Dosage strength (e.g., "500mg", "10ml") */
  dosage: string;
  /** Frequency of intake (e.g., "Twice a day", "Every 8 hours") */
  frequency: string;
  /** Duration of treatment (e.g., "5 days", "2 weeks") */
  duration?: string;
  /** AI-inferred purpose of the medication */
  purpose?: string;
  /** Brief summary of potential side effects */
  sideEffects?: string;
  /** Form of medication (e.g., "Tablet", "Capsule", "Syrup") */
  type?: string;
  /** Base64 image of purchase proof (receipt or pill pack) */
  purchaseProofImage?: string;
  /** Total number of pills in the pack */
  totalPills?: number;
  /** Number of pills remaining */
  pillsRemaining?: number;
}

/**
 * AI-analyzed medical document data
 */
export interface MedicalAnalysis {
  /** Professional title for the document */
  title: string;
  /** Classification of the medical document */
  documentType: DocumentType;
  /** Date of the document (Format: "MMM DD, YYYY" or "Undated") */
  date: string;
  /** Name of the attending doctor/practitioner */
  doctorName?: string;
  /** Name of the hospital, clinic, or medical facility */
  facilityName?: string;
  /** Name of the patient */
  patientName?: string;
  /** List of diagnosed conditions or symptoms */
  diagnosis: string[];
  /** List of prescribed medications */
  medications: Medication[];
  /** AI-generated 2-3 sentence professional summary */
  summary: string;
  /** Actionable follow-up instructions */
  nextSteps: string[];
}

/**
 * Complete medical record with metadata
 */
export interface MedicalRecord {
  /** Unique identifier (timestamp-based) */
  id: string;
  /** Unix timestamp of record creation */
  createdAt: number;
  /** Base64-encoded image of the original document */
  imageUrl: string;
  /** AI-analyzed data from the document */
  analysis: MedicalAnalysis;
}

/**
 * Document type classification
 */
export type DocumentType = 'Prescription' | 'Lab Report' | 'Diagnosis' | 'Other';

/**
 * Navigation route parameters
 */
export type RootStackParamList = {
  MainTabs: undefined;
  Detail: { recordId: string };
  MedDetail: { medication: Medication; sourceId?: string };
  Scan: { targetScreen?: keyof RootStackParamList };
};

export type MainTabParamList = {
  Home: undefined;
  Meds: undefined;
  Schedule: undefined;
  History: undefined;
  Tests: undefined;
};

/**
 * Extended medication with source tracking
 */
export interface MedicationWithSource extends Medication {
  /** ID of the source record */
  sourceId: string;
  /** Date from the source record */
  sourceDate: string;
}

/**
 * Application loading states
 */
export interface LoadingState {
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Calendar day information
 */
export interface CalendarDay {
  dayName: string;
  dayNumber: number;
  offset: number;
  isSelected: boolean;
}

/**
 * Schedule time slot
 */
export interface TimeSlot {
  time: string;
  period: 'AM' | 'PM';
  medications: MedicationWithSource[];
  label: string;
}

/**
 * Lab test parameter with standard values
 */
export interface TestParameter {
  /** Name of the test parameter */
  name: string;
  /** Measured value */
  value: string;
  /** Unit of measurement */
  unit: string;
  /** Normal/reference range */
  referenceRange: string;
  /** Status compared to reference */
  status: 'normal' | 'low' | 'high' | 'critical';
  /** Interpretation of the result */
  interpretation?: string;
}

/**
 * Test category grouping
 */
export interface TestCategory {
  /** Category name (e.g., "Complete Blood Count", "Liver Function") */
  name: string;
  /** Tests in this category */
  parameters: TestParameter[];
}

/**
 * AI-analyzed lab test report
 */
export interface LabTestAnalysis {
  /** Title of the test report */
  title: string;
  /** Date of the test */
  date: string;
  /** Patient name if visible */
  patientName?: string;
  /** Lab/facility name */
  labName?: string;
  /** Doctor who ordered the test */
  referringDoctor?: string;
  /** Categorized test results */
  testCategories: TestCategory[];
  /** Overall health summary */
  healthSummary: string;
  /** Key findings (abnormal results) */
  keyFindings: string[];
  /** Recommendations based on results */
  recommendations: string[];
  /** Overall condition assessment */
  conditionAssessment: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' | 'Critical';
  /** Detailed explanation of condition */
  conditionExplanation: string;
}

/**
 * Complete lab test record
 */
export interface LabTestRecord {
  /** Unique identifier */
  id: string;
  /** Unix timestamp of record creation */
  createdAt: number;
  /** Base64-encoded image of the original document */
  imageUrl: string;
  /** AI-analyzed lab test data */
  analysis: LabTestAnalysis;
}

/**
 * Medication calendar event
 */
export interface MedicationCalendarEvent {
  /** Unique event identifier from device calendar */
  eventId: string;
  /** Associated medication name */
  medicationName: string;
  /** Scheduled date and time */
  scheduledAt: Date;
  /** Whether reminder notification is set */
  hasReminder: boolean;
  /** Minutes before event for reminder (default: 30) */
  reminderMinutesBefore: number;
}

/**
 * Calendar integration settings
 */
export interface CalendarSettings {
  /** Whether calendar integration is enabled */
  enabled: boolean;
  /** Default reminder time in minutes before dose */
  defaultReminderMinutes: number;
  /** ID of the MediVault calendar on device */
  calendarId?: string;
  /** Whether to automatically add events after scanning */
  autoAddOnScan: boolean;
}

/**
 * Scheduled notification data
 */
export interface ScheduledNotification {
  /** Notification identifier */
  id: string;
  /** Medication name */
  medicationName: string;
  /** Scheduled notification time */
  scheduledAt: Date;
  /** Event date (medication time) */
  eventDate: Date;
}
