/**
 * MediVault AI - Color Palette
 * Teal-based theme for health and wellness
 */

export const colors = {
  // Primary - Teal (Health & Calmness)
  primary: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },

  // Gray - Neutral tones
  gray: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },

  // Semantic Colors
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
  },

  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    500: '#A855F7',
    600: '#9333EA',
  },

  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    300: '#FDBA74',
    500: '#F97316',
  },

  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    400: '#FBBF24',
    800: '#92400E',
    900: '#78350F',
  },

  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    800: '#3730A3',
  },

  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
  },

  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
  },

  green: {
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34F',
  },

  // Background Colors
  background: {
    primary: '#FAFAFA',
    secondary: '#FFFFFF',
    tertiary: '#F4F4F5',
  },

  // Text Colors
  text: {
    primary: '#18181B',
    secondary: '#71717A',
    tertiary: '#A1A1AA',
    inverse: '#FFFFFF',
  },

  // Border Colors
  border: {
    light: '#F4F4F5',
    default: '#E4E4E7',
    dark: '#D4D4D8',
  },

  // Transparent overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.9)',
    dark: 'rgba(0, 0, 0, 0.5)',
  },

  // Status Colors
  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Common
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;
