/**
 * MediVault AI - Button Component
 * Reusable button with multiple variants
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';

/**
 * Button variants
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Button component with multiple variants and sizes
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? colors.white : colors.primary[600]} 
        />
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && icon}
        <Text style={textStyles}>{title}</Text>
        {icon && iconPosition === 'right' && icon}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
    borderRadius: borderRadius.xl,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary[600],
  },
  secondary: {
    backgroundColor: colors.gray[900],
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  danger: {
    backgroundColor: colors.red[500],
  },

  // Sizes
  size_sm: {
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['3'],
    minHeight: 32,
  },
  size_md: {
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['4'],
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['6'],
    minHeight: 52,
  },

  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  text_primary: {
    color: colors.white,
  },
  text_secondary: {
    color: colors.white,
  },
  text_outline: {
    color: colors.text.primary,
  },
  text_ghost: {
    color: colors.primary[600],
  },
  text_danger: {
    color: colors.white,
  },

  // Text sizes
  textSize_sm: {
    fontSize: fontSize.sm,
  },
  textSize_md: {
    fontSize: fontSize.base,
  },
  textSize_lg: {
    fontSize: fontSize.md,
  },

  textDisabled: {
    opacity: 0.7,
  },
});

export default Button;
