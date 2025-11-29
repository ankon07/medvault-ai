/**
 * MediVault AI - Theme System
 * Centralized export of all theme tokens
 */

export * from './colors';
export * from './typography';
export * from './spacing';

import { colors } from './colors';
import { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textStyles } from './typography';
import { spacing, borderRadius, shadows, sizes } from './spacing';

/**
 * Complete theme object
 */
export const theme = {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyles,
  spacing,
  borderRadius,
  shadows,
  sizes,
} as const;

export type Theme = typeof theme;
export default theme;
