/**
 * MediVault AI - Internationalization Setup
 * Supports English and Bangla languages
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import bn from './locales/bn.json';

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = '@medivault_language';

// Bangla numerals mapping
const BANGLA_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

// Supported languages
export const LANGUAGES = {
  en: { name: 'English', nativeName: 'Eng', code: 'en' },
  bn: { name: 'Bengali', nativeName: 'বাং', code: 'bn' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

/**
 * Convert a number to Bangla numerals
 * @param num - The number to convert (can be number or string)
 * @returns String with Bangla numerals if language is Bengali, otherwise original
 */
export const toBanglaNumber = (num: number | string): string => {
  const currentLang = getCurrentLanguage();
  const numStr = String(num);
  
  if (currentLang !== 'bn') {
    return numStr;
  }
  
  return numStr.replace(/[0-9]/g, (digit) => BANGLA_NUMERALS[parseInt(digit, 10)]);
};

/**
 * Format a number with the current language's numerals
 * @param num - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number | string): string => {
  return toBanglaNumber(num);
};

/**
 * Get the stored language preference
 */
export const getStoredLanguage = async (): Promise<LanguageCode | null> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'bn')) {
      return storedLanguage as LanguageCode;
    }
    return null;
  } catch (error) {
    console.error('Error getting stored language:', error);
    return null;
  }
};

/**
 * Store the language preference
 */
export const setStoredLanguage = async (language: LanguageCode): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error storing language:', error);
  }
};

/**
 * Detect the device language and map to supported language
 */
const getDeviceLanguage = (): LanguageCode => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
  
  // Map to supported languages
  if (deviceLocale === 'bn' || deviceLocale === 'be') {
    return 'bn';
  }
  return 'en';
};

/**
 * Initialize i18n with the appropriate language
 */
const initializeI18n = async () => {
  // Try to get stored preference first
  const storedLanguage = await getStoredLanguage();
  const initialLanguage = storedLanguage || getDeviceLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        bn: { translation: bn },
      },
      lng: initialLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return initialLanguage;
};

// Initialize immediately
initializeI18n();

/**
 * Change the app language
 */
export const changeLanguage = async (language: LanguageCode): Promise<void> => {
  await i18n.changeLanguage(language);
  await setStoredLanguage(language);
};

/**
 * Get the current language
 */
export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language as LanguageCode) || 'en';
};

/**
 * Get the language name for AI prompts
 */
export const getLanguageNameForAI = (): string => {
  const currentLang = getCurrentLanguage();
  return currentLang === 'bn' ? 'Bengali' : 'English';
};

export default i18n;
