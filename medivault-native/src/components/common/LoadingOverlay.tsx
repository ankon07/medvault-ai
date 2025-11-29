/**
 * MediVault AI - Loading Overlay Component
 * Full screen loading indicator for async operations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Activity, Loader2 } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  submessage?: string;
}

/**
 * Loading overlay for document analysis
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Analyzing...',
  submessage = 'AI is reading the details, dosages, and notes for you.',
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Loader container */}
          <View style={styles.loaderContainer}>
            <View style={styles.loaderBg}>
              <ActivityIndicator 
                size="large" 
                color={colors.primary[600]} 
              />
            </View>
            <View style={styles.activityBadge}>
              <Activity size={20} color={colors.primary[500]} />
            </View>
          </View>

          {/* Text */}
          <Text style={styles.title}>{message}</Text>
          <Text style={styles.subtitle}>{submessage}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.overlay.light,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['8'],
  },
  content: {
    alignItems: 'center',
  },
  loaderContainer: {
    position: 'relative',
    marginBottom: spacing['8'],
  },
  loaderBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: colors.white,
    padding: spacing['2'],
    borderRadius: borderRadius.full,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['2'],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
});

export default LoadingOverlay;
