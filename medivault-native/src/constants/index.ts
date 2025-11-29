/**
 * MediVault AI - Application Constants
 */

/**
 * AsyncStorage keys for data persistence
 */
export const STORAGE_KEYS = {
  RECORDS: 'mediVault_records',
  SETTINGS: 'mediVault_settings',
  USER_PROFILE: 'mediVault_userProfile',
} as const;

/**
 * Document type display configuration
 */
export const DOCUMENT_TYPE_CONFIG = {
  Prescription: {
    label: 'Rx',
    color: 'blue',
    bgColor: '#EFF6FF',
    textColor: '#2563EB',
  },
  'Lab Report': {
    label: 'Lb',
    color: 'purple',
    bgColor: '#FAF5FF',
    textColor: '#9333EA',
  },
  Diagnosis: {
    label: 'Dx',
    color: 'emerald',
    bgColor: '#ECFDF5',
    textColor: '#059669',
  },
  Other: {
    label: 'Dc',
    color: 'gray',
    bgColor: '#F4F4F5',
    textColor: '#52525B',
  },
} as const;

/**
 * Medication type icons mapping
 */
export const MEDICATION_TYPES = {
  tablet: 'Tablets',
  capsule: 'Pill',
  syrup: 'Droplets',
  cream: 'Cream',
  injection: 'Syringe',
  default: 'Tablets',
} as const;

/**
 * Schedule time slots
 */
export const TIME_SLOTS = {
  morning: {
    time: '8:00',
    period: 'AM',
    label: 'Morning',
    borderColor: '#FDBA74', // orange-300
  },
  afternoon: {
    time: '2:00',
    period: 'PM',
    label: 'Afternoon',
    borderColor: '#93C5FD', // blue-300
  },
  evening: {
    time: '8:00',
    period: 'PM',
    label: 'Evening',
    borderColor: '#818CF8', // indigo-400
  },
} as const;

/**
 * API Configuration
 */
export const API_CONFIG = {
  GEMINI_MODEL: 'gemini-2.5-flash',
  MAX_IMAGE_WIDTH: 1024,
  JPEG_QUALITY: 0.6,
  REQUEST_TIMEOUT: 30000,
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * Default user profile
 */
export const DEFAULT_USER = {
  name: 'User',
  initials: 'U',
} as const;
