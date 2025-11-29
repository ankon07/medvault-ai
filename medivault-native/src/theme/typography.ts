/**
 * MediVault AI - Typography System
 * Font families, sizes, weights, and text styles
 */

import { TextStyle } from 'react-native';

/**
 * Font family configuration
 * Using system fonts for better performance
 * Can be replaced with custom fonts like 'Plus Jakarta Sans'
 */
export const fontFamily = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
} as const;

/**
 * Font sizes following a consistent scale
 */
export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

/**
 * Font weights
 */
export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extraBold: '800' as TextStyle['fontWeight'],
} as const;

/**
 * Line heights
 */
export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

/**
 * Letter spacing
 */
export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
  widest: 1,
} as const;

/**
 * Pre-defined text styles
 */
export const textStyles: Record<string, TextStyle> = {
  // Headings
  h1: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xl * lineHeight.snug,
  },
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.lg * lineHeight.snug,
  },

  // Body text
  bodyLarge: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.relaxed,
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.base * lineHeight.relaxed,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.relaxed,
  },

  // Labels
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  labelSmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
  },

  // Captions
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase',
  },

  // Buttons
  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  buttonSmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.sm * lineHeight.normal,
  },

  // Numbers
  number: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  numberLarge: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
  },
} as const;

export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type TextStyleKey = keyof typeof textStyles;
