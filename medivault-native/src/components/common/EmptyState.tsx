/**
 * MediVault AI - Empty State Component
 * Placeholder for empty lists/views
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Empty state placeholder component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['8'],
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.default,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['4'],
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing['2'],
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: spacing['4'],
  },
});

export default EmptyState;
