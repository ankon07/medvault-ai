/**
 * MediVault AI - Date Utilities
 * Helper functions for date manipulation and formatting
 */

/**
 * Days of the week abbreviations
 */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Get day name abbreviation with offset from today
 * @param offset - Number of days from today (negative for past, positive for future)
 * @returns Day name abbreviation (e.g., "Mon", "Tue")
 */
export const getDayName = (offset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return DAYS[date.getDay()];
};

/**
 * Get day number with offset from today
 * @param offset - Number of days from today
 * @returns Day of month (1-31)
 */
export const getDayNumber = (offset: number): number => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.getDate();
};

/**
 * Get full date string with offset
 * @param offset - Number of days from today (default: 0)
 * @returns Formatted date string (e.g., "Monday, November 29")
 */
export const getFullDateString = (offset: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format a date to display format
 * @param date - Date object or timestamp
 * @returns Formatted date string (e.g., "Nov 29, 2024")
 */
export const formatDate = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a timestamp to relative time
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string (e.g., "2 hours ago", "Yesterday")
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  
  return formatDate(timestamp);
};

/**
 * Get greeting based on time of day
 * @returns Greeting string (e.g., "Good Morning")
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Parse a date string from AI response
 * @param dateString - Date string from AI (e.g., "Nov 29, 2024" or "Undated")
 * @returns Date object or null if invalid/undated
 */
export const parseAIDate = (dateString: string): Date | null => {
  if (!dateString || dateString.toLowerCase() === 'undated') {
    return null;
  }
  
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns boolean
 */
export const isToday = (date: Date | number): boolean => {
  const d = typeof date === 'number' ? new Date(date) : date;
  const today = new Date();
  
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * Generate unique ID based on timestamp
 * @returns Unique string ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
