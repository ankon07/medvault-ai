/**
 * MediVault AI - Scan Screen
 * Image capture and document analysis
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Camera, Image as ImageIcon, X, Sparkles } from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { LoadingOverlay } from '../components/common';
import { useRecordStore } from '../store/useRecordStore';
import { captureImage, selectImage } from '../services/imageService';
import { analyzeMedicalDocument, ImageAnalysisError, ERROR_CODES } from '../services/geminiService';
import { promptAndAddToCalendar } from '../services/calendarService';
import { generateId } from '../utils/dateUtils';
import { MedicalRecord } from '../types';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Scan'>;

const ScanScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { addRecord, setAnalyzing, setError } = useRecordStore();
  const [localAnalyzing, setLocalAnalyzing] = useState(false);

  /**
   * Get user-friendly error title based on error code
   */
  const getErrorTitle = (error: unknown): string => {
    if (error instanceof ImageAnalysisError) {
      switch (error.code) {
        case ERROR_CODES.NOT_MEDICAL_DOCUMENT:
          return t('scan.errors.notMedicalDocument');
        case ERROR_CODES.INVALID_IMAGE:
          return t('scan.errors.invalidImage');
        case ERROR_CODES.NETWORK_ERROR:
          return t('scan.errors.connectionError');
        case ERROR_CODES.QUOTA_EXCEEDED:
          return t('scan.errors.serviceUnavailable');
        case ERROR_CODES.SAFETY_BLOCKED:
          return t('scan.errors.imageNotSupported');
        case ERROR_CODES.API_KEY_INVALID:
          return t('scan.errors.configurationError');
        default:
          return t('scan.errors.analysisFailed');
      }
    }
    return t('common.error');
  };

  /**
   * Get helpful suggestions based on error code
   */
  const getErrorSuggestion = (error: unknown): string | undefined => {
    if (error instanceof ImageAnalysisError) {
      switch (error.code) {
        case ERROR_CODES.NOT_MEDICAL_DOCUMENT:
          return '\n\n' + t('scan.errors.notMedicalDocumentTip');
        case ERROR_CODES.INVALID_IMAGE:
          return '\n\n' + t('scan.errors.invalidImageTip');
        case ERROR_CODES.NETWORK_ERROR:
          return '\n\n' + t('scan.errors.connectionErrorTip');
        default:
          return undefined;
      }
    }
    return undefined;
  };

  const handleImageProcess = async (base64: string) => {
    setLocalAnalyzing(true);
    setAnalyzing(true);

    try {
      const analysis = await analyzeMedicalDocument(base64);
      
      const newRecord: MedicalRecord = {
        id: generateId(),
        createdAt: Date.now(),
        imageUrl: base64,
        analysis,
      };

      await addRecord(newRecord);
      
      // If prescription has medications, prompt to add to calendar
      if (analysis.documentType === 'Prescription' && analysis.medications.length > 0) {
        // Small delay to let the UI settle before showing the calendar prompt
        setTimeout(() => {
          promptAndAddToCalendar(analysis.medications);
        }, 500);
      }
      
      // Navigate to detail screen
      navigation.navigate('Detail', { recordId: newRecord.id } as never);
    } catch (error: unknown) {
      const title = getErrorTitle(error);
      const message = error instanceof Error ? error.message : 'Failed to analyze the document. Please try again.';
      const suggestion = getErrorSuggestion(error);
      
      setError(message);
      
      Alert.alert(
        title, 
        message + (suggestion || ''),
        [
          { text: t('common.tryAgain'), onPress: () => {}, style: 'cancel' },
          { text: t('common.ok'), style: 'default' },
        ]
      );
    } finally {
      setLocalAnalyzing(false);
      setAnalyzing(false);
    }
  };

  const handleCapture = async () => {
    const result = await captureImage();
    if (result.success && result.base64) {
      await handleImageProcess(result.base64);
    } else if (result.error && result.error !== 'Image capture was cancelled.') {
      Alert.alert(t('common.error'), result.error);
    }
  };

  const handleSelect = async () => {
    const result = await selectImage();
    if (result.success && result.base64) {
      await handleImageProcess(result.base64);
    } else if (result.error && result.error !== 'Image selection was cancelled.') {
      Alert.alert(t('common.error'), result.error);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LoadingOverlay 
        visible={localAnalyzing} 
        message={t('scan.analyzing')}
        submessage={t('scan.analyzingSubtext')}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scan.scanDocument')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.illustration}>
          <View style={styles.iconCircle}>
            <Sparkles size={48} color={colors.primary[600]} />
          </View>
          <Text style={styles.title}>{t('scan.aiPoweredAnalysis')}</Text>
          <Text style={styles.description}>
            {t('scan.description')}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCapture}
            activeOpacity={0.9}
          >
            <Camera size={24} color={colors.white} />
            <Text style={styles.primaryButtonText}>{t('scan.takePhoto')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSelect}
            activeOpacity={0.8}
          >
            <ImageIcon size={24} color={colors.text.primary} />
            <Text style={styles.secondaryButtonText}>{t('scan.chooseFromGallery')}</Text>
          </TouchableOpacity>
        </View>

        {/* Supported formats */}
        <View style={styles.supportedFormats}>
          <Text style={styles.supportedText}>
            {t('scan.supportedFormats')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: spacing['6'],
    justifyContent: 'center',
  },
  illustration: {
    alignItems: 'center',
    marginBottom: spacing['12'],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['6'],
    ...shadows.lg,
    shadowColor: colors.primary[600],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['2'],
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing['4'],
    lineHeight: 22,
  },
  actions: {
    gap: spacing['4'],
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['3'],
    ...shadows.md,
  },
  primaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['3'],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  secondaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  supportedFormats: {
    marginTop: spacing['8'],
    alignItems: 'center',
  },
  supportedText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default ScanScreen;
