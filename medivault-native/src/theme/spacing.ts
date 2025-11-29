/**
 * MediVault AI - Spacing System
 * Consistent spacing values for margins, padding, and gaps
 */

/**
 * Base spacing unit (4px)
 */
const BASE = 4;

/**
 * Spacing scale following a 4px base unit
 */
export const spacing = {
  /** 0px */
  none: 0,
  /** 2px */
  '0.5': BASE * 0.5,
  /** 4px */
  '1': BASE,
  /** 6px */
  '1.5': BASE * 1.5,
  /** 8px */
  '2': BASE * 2,
  /** 10px */
  '2.5': BASE * 2.5,
  /** 12px */
  '3': BASE * 3,
  /** 14px */
  '3.5': BASE * 3.5,
  /** 16px */
  '4': BASE * 4,
  /** 20px */
  '5': BASE * 5,
  /** 24px */
  '6': BASE * 6,
  /** 28px */
  '7': BASE * 7,
  /** 32px */
  '8': BASE * 8,
  /** 36px */
  '9': BASE * 9,
  /** 40px */
  '10': BASE * 10,
  /** 44px */
  '11': BASE * 11,
  /** 48px */
  '12': BASE * 12,
  /** 56px */
  '14': BASE * 14,
  /** 64px */
  '16': BASE * 16,
  /** 80px */
  '20': BASE * 20,
  /** 96px */
  '24': BASE * 24,
  /** 128px */
  '32': BASE * 32,
} as const;

/**
 * Border radius values
 */
export const borderRadius = {
  /** 0px */
  none: 0,
  /** 4px */
  sm: 4,
  /** 8px */
  md: 8,
  /** 12px */
  lg: 12,
  /** 16px */
  xl: 16,
  /** 20px */
  '2xl': 20,
  /** 24px */
  '3xl': 24,
  /** 32px */
  '4xl': 32,
  /** 9999px - for pills/circles */
  full: 9999,
} as const;

/**
 * Shadow presets for elevation
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

/**
 * Common size presets for icons, buttons, etc.
 */
export const sizes = {
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },
  button: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
  },
  avatar: {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  },
  card: {
    sm: 120,
    md: 160,
    lg: 200,
  },
} as const;

export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
