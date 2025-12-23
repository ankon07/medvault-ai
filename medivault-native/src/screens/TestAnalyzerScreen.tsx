/**
 * MediVault AI - Test Analyzer Screen
 * Lab test report image capture and AI-powered analysis
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  FlaskConical,
  Camera,
  Image as ImageIcon,
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Heart,
  Eye,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { LoadingOverlay } from '../components/common';
import { captureImage, selectImage } from '../services/imageService';
import { analyzeLabTestReport, ImageAnalysisError, ERROR_CODES } from '../services/geminiService';
import { generateId } from '../utils/dateUtils';
import { LabTestAnalysis, LabTestRecord, TestParameter } from '../types';
import { RootStackScreenProps } from '../navigation/types';
import { useRecordStore } from '../store/useRecordStore';

type Props = RootStackScreenProps<'TestAnalyzer'>;

const TestAnalyzerScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LabTestRecord | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Get store functions
  const { addLabTestRecord } = useRecordStore();

  /**
   * Get user-friendly error title based on error code
   */
  const getErrorTitle = (error: unknown): string => {
    if (error instanceof ImageAnalysisError) {
      switch (error.code) {
        case ERROR_CODES.NOT_MEDICAL_DOCUMENT:
          return t('testAnalyzer.errors.notLabReport');
        case ERROR_CODES.INVALID_IMAGE:
          return t('testAnalyzer.errors.invalidImage');
        case ERROR_CODES.NETWORK_ERROR:
          return t('testAnalyzer.errors.connectionError');
        case ERROR_CODES.QUOTA_EXCEEDED:
          return t('testAnalyzer.errors.serviceUnavailable');
        case ERROR_CODES.SAFETY_BLOCKED:
          return t('testAnalyzer.errors.imageNotSupported');
        case ERROR_CODES.API_KEY_INVALID:
          return t('testAnalyzer.errors.configError');
        default:
          return t('testAnalyzer.errors.analysisFailed');
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
          return '\n\n' + t('testAnalyzer.errors.notLabReportTip');
        case ERROR_CODES.INVALID_IMAGE:
          return '\n\n' + t('testAnalyzer.errors.invalidImageTip');
        case ERROR_CODES.NETWORK_ERROR:
          return '\n\n' + t('testAnalyzer.errors.connectionTip');
        default:
          return undefined;
      }
    }
    return undefined;
  };

  const handleImageProcess = async (base64: string) => {
    setIsAnalyzing(true);
    setIsSaved(false);

    try {
      const analysis = await analyzeLabTestReport(base64);
      
      const newRecord: LabTestRecord = {
        id: generateId(),
        createdAt: Date.now(),
        imageUrl: base64,
        analysis,
      };

      // Save to Firebase automatically
      try {
        await addLabTestRecord(newRecord);
        setIsSaved(true);
      } catch (saveError) {
        console.error('Error saving lab test record:', saveError);
        // Still show the result even if save fails
      }

      setAnalysisResult(newRecord);
    } catch (error: unknown) {
      const title = getErrorTitle(error);
      const message = error instanceof Error ? error.message : 'Failed to analyze the lab report. Please try again.';
      const suggestion = getErrorSuggestion(error);
      
      Alert.alert(
        title, 
        message + (suggestion || ''),
        [
          { text: t('testAnalyzer.errors.tryAgain'), onPress: () => {}, style: 'cancel' },
          { text: t('common.ok'), style: 'default' },
        ]
      );
    } finally {
      setIsAnalyzing(false);
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

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
    setShowOriginal(false);
    setIsSaved(false);
  };

  const getStatusIcon = (status: TestParameter['status']) => {
    switch (status) {
      case 'high':
        return <TrendingUp size={16} color={colors.amber[800]} />;
      case 'low':
        return <TrendingDown size={16} color={colors.blue[600]} />;
      case 'critical':
        return <AlertTriangle size={16} color={colors.red[500]} />;
      default:
        return <Minus size={16} color={colors.green[500]} />;
    }
  };

  const getStatusColor = (status: TestParameter['status']) => {
    switch (status) {
      case 'high':
        return { bg: colors.amber[50], border: colors.amber[100], text: colors.amber[800] };
      case 'low':
        return { bg: colors.blue[50], border: colors.blue[100], text: colors.blue[600] };
      case 'critical':
        return { bg: colors.red[50], border: colors.red[100], text: colors.red[500] };
      default:
        return { bg: colors.green[100], border: colors.green[100], text: colors.green[600] };
    }
  };

  const getConditionColor = (condition: LabTestAnalysis['conditionAssessment']) => {
    switch (condition) {
      case 'Excellent':
        return { bg: colors.emerald[50], text: colors.emerald[600], icon: colors.emerald[500] };
      case 'Good':
        return { bg: colors.green[100], text: colors.green[600], icon: colors.green[500] };
      case 'Fair':
        return { bg: colors.amber[50], text: colors.amber[800], icon: colors.amber[400] };
      case 'Needs Attention':
        return { bg: colors.orange[50], text: colors.orange[500], icon: colors.orange[500] };
      case 'Critical':
        return { bg: colors.red[50], text: colors.red[500], icon: colors.red[500] };
      default:
        return { bg: colors.gray[50], text: colors.gray[600], icon: colors.gray[400] };
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Initial upload screen
  if (!analysisResult) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingOverlay 
          visible={isAnalyzing} 
          message={t('testAnalyzer.analyzing')}
          submessage={t('testAnalyzer.analyzingSubtext')}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.closeButton}>
            <ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('testAnalyzer.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.illustration}>
            <View style={styles.iconCircle}>
              <FlaskConical size={48} color={colors.purple[600]} />
            </View>
            <Text style={styles.title}>{t('testAnalyzer.labTestAnalysis')}</Text>
            <Text style={styles.description}>
              {t('testAnalyzer.description')}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.blue[50] }]}>
                <Activity size={20} color={colors.blue[500]} />
              </View>
              <Text style={styles.featureText}>{t('testAnalyzer.compareWithStandards')}</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.emerald[50] }]}>
                <Heart size={20} color={colors.emerald[500]} />
              </View>
              <Text style={styles.featureText}>{t('testAnalyzer.healthAssessment')}</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.amber[50] }]}>
                <Sparkles size={20} color={colors.amber[400]} />
              </View>
              <Text style={styles.featureText}>{t('testAnalyzer.aiRecommendations')}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCapture}
              activeOpacity={0.9}
            >
              <Camera size={24} color={colors.white} />
              <Text style={styles.primaryButtonText}>{t('testAnalyzer.takePhoto')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSelect}
              activeOpacity={0.8}
            >
              <ImageIcon size={24} color={colors.text.primary} />
              <Text style={styles.secondaryButtonText}>{t('testAnalyzer.chooseFromGallery')}</Text>
            </TouchableOpacity>
          </View>

          {/* Supported formats */}
          <View style={styles.supportedFormats}>
            <Text style={styles.supportedText}>
              {t('testAnalyzer.supportedFormats')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Analysis Result Screen
  const { analysis } = analysisResult;
  const conditionColors = getConditionColor(analysis.conditionAssessment);

  // Helper to translate status labels
  const getStatusLabel = (status: string): string => {
    const statusKey = status.toLowerCase();
    const statusMap: Record<string, string> = {
      'normal': t('testAnalyzer.normal'),
      'low': t('testAnalyzer.low'),
      'high': t('testAnalyzer.high'),
      'critical': t('testAnalyzer.critical'),
    };
    return statusMap[statusKey] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Helper to translate condition assessment
  const getConditionLabel = (condition: string): string => {
    const conditionMap: Record<string, string> = {
      'Excellent': t('testAnalyzer.excellent'),
      'Good': t('testAnalyzer.good'),
      'Fair': t('testAnalyzer.fair'),
      'Needs Attention': t('testAnalyzer.needsAttention'),
      'Critical': t('testAnalyzer.critical'),
    };
    return conditionMap[condition] || condition;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.resultContent, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleNewAnalysis} style={styles.closeButton}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('testAnalyzer.testResults')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={[styles.heroIcon, { backgroundColor: colors.purple[500] }]}>
            <FlaskConical size={32} color={colors.white} />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{analysis.title}</Text>
            <Text style={styles.heroDate}>{analysis.date}</Text>
            {isSaved && (
              <View style={styles.savedBadge}>
                <CheckCircle2 size={12} color={colors.green[500]} />
                <Text style={styles.savedText}>{t('testAnalyzer.saved')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.heroDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('testAnalyzer.lab')}</Text>
            <Text style={styles.detailValue}>{analysis.labName || t('testAnalyzer.notListed')}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('testAnalyzer.referredBy')}</Text>
            <Text style={styles.detailValue}>{analysis.referringDoctor || t('testAnalyzer.notListed')}</Text>
          </View>
        </View>
      </View>

      {/* Condition Assessment Card */}
      <View style={[styles.conditionCard, { backgroundColor: conditionColors.bg }]}>
        <View style={styles.conditionHeader}>
          <View style={[styles.conditionIconContainer, { backgroundColor: colors.white }]}>
            <Heart size={24} color={conditionColors.icon} />
          </View>
          <View style={styles.conditionContent}>
            <Text style={styles.conditionLabel}>{t('testAnalyzer.overallCondition')}</Text>
            <Text style={[styles.conditionValue, { color: conditionColors.text }]}>
              {getConditionLabel(analysis.conditionAssessment)}
            </Text>
          </View>
        </View>
        <Text style={[styles.conditionExplanation, { color: conditionColors.text }]}>
          {analysis.conditionExplanation}
        </Text>
      </View>

      {/* AI Health Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Sparkles size={16} color={colors.white} />
          <Text style={styles.summaryLabel}>{t('testAnalyzer.healthSummary')}</Text>
        </View>
        <Text style={styles.summaryText}>{analysis.healthSummary}</Text>
      </View>

      {/* Key Findings */}
      {(analysis.keyFindings?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={18} color={colors.amber[800]} />
            <Text style={[styles.sectionTitle, { color: colors.amber[800] }]}>{t('testAnalyzer.keyFindings')}</Text>
          </View>
          {analysis.keyFindings.map((finding, i) => (
            <View key={i} style={styles.findingItem}>
              <View style={styles.findingDot} />
              <Text style={styles.findingText}>{finding}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Test Results by Category */}
      {(analysis.testCategories || []).map((category, catIndex) => (
        <View key={catIndex} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={18} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>{category.name}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{(category.parameters || []).length}</Text>
            </View>
          </View>
          
          {(category.parameters || []).map((param, paramIndex) => {
            const statusColors = getStatusColor(param.status);
            return (
              <View key={paramIndex} style={styles.paramCard}>
                <View style={styles.paramHeader}>
                  <Text style={styles.paramName}>{param.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
                    {getStatusIcon(param.status)}
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {getStatusLabel(param.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.paramValues}>
                  <View style={styles.paramValueItem}>
                    <Text style={styles.paramValueLabel}>{t('testAnalyzer.result')}</Text>
                    <Text style={[styles.paramValue, { color: statusColors.text }]}>
                      {param.value} {param.unit}
                    </Text>
                  </View>
                  <View style={styles.paramValueItem}>
                    <Text style={styles.paramValueLabel}>{t('testAnalyzer.reference')}</Text>
                    <Text style={styles.paramReference}>{param.referenceRange} {param.unit}</Text>
                  </View>
                </View>
                
                {param.interpretation && (
                  <Text style={styles.paramInterpretation}>{param.interpretation}</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}

      {/* Recommendations */}
      {(analysis.recommendations?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle2 size={18} color={colors.indigo[800]} />
            <Text style={[styles.sectionTitle, { color: colors.indigo[800] }]}>{t('testAnalyzer.recommendations')}</Text>
          </View>
          {analysis.recommendations.map((rec, i) => (
            <View key={i} style={styles.recommendationItem}>
              <ChevronRight size={16} color={colors.indigo[400]} />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}

      {/* View Original */}
      <TouchableOpacity
        style={styles.viewOriginalButton}
        onPress={() => setShowOriginal(!showOriginal)}
      >
        <Eye size={18} color={colors.text.secondary} />
        <Text style={styles.viewOriginalText}>
          {showOriginal ? t('testAnalyzer.hideOriginalReport') : t('testAnalyzer.viewOriginalReport')}
        </Text>
      </TouchableOpacity>

      {showOriginal && (
        <View style={styles.originalImageContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${analysisResult.imageUrl}` }}
            style={styles.originalImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* New Analysis Button */}
      <TouchableOpacity
        style={styles.newAnalysisButton}
        onPress={handleNewAnalysis}
        activeOpacity={0.9}
      >
        <FlaskConical size={20} color={colors.white} />
        <Text style={styles.newAnalysisText}>{t('testAnalyzer.scanLabReport')}</Text>
      </TouchableOpacity>

      <View style={{ height: spacing['24'] }} />
    </ScrollView>
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: spacing['6'],
    justifyContent: 'center',
  },
  resultContent: {
    padding: spacing['6'],
  },
  illustration: {
    alignItems: 'center',
    marginBottom: spacing['8'],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.purple[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['6'],
    ...shadows.lg,
    shadowColor: colors.purple[600],
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
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing['8'],
  },
  featureItem: {
    alignItems: 'center',
    gap: spacing['2'],
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 80,
  },
  actions: {
    gap: spacing['4'],
  },
  primaryButton: {
    backgroundColor: colors.purple[600],
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
  // Result Styles
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['4xl'],
    padding: spacing['6'],
    marginBottom: spacing['4'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing['6'],
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['4'],
    ...shadows.lg,
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['1'],
  },
  heroDate: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  heroDetails: {
    flexDirection: 'row',
    gap: spacing['4'],
  },
  detailItem: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing['1'],
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  conditionCard: {
    borderRadius: borderRadius['4xl'],
    padding: spacing['6'],
    marginBottom: spacing['4'],
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['4'],
  },
  conditionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['4'],
  },
  conditionContent: {
    flex: 1,
  },
  conditionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conditionValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  conditionExplanation: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius['4xl'],
    padding: spacing['6'],
    marginBottom: spacing['4'],
    ...shadows.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['4'],
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: fontSize.sm,
    color: colors.gray[200],
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['4xl'],
    padding: spacing['6'],
    marginBottom: spacing['4'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['4'],
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    borderRadius: borderRadius.full,
  },
  countText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing['3'],
  },
  findingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amber[400],
    marginTop: 6,
    marginRight: spacing['3'],
  },
  findingText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.amber[800],
    lineHeight: 20,
  },
  paramCard: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    marginBottom: spacing['3'],
  },
  paramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['3'],
  },
  paramName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  paramValues: {
    flexDirection: 'row',
    gap: spacing['4'],
    marginBottom: spacing['2'],
  },
  paramValueItem: {
    flex: 1,
  },
  paramValueLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    color: colors.text.tertiary,
    marginBottom: spacing['1'],
  },
  paramValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  paramReference: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.text.secondary,
  },
  paramInterpretation: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing['2'],
    paddingTop: spacing['2'],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing['3'],
  },
  recommendationText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.indigo[800],
    lineHeight: 20,
    marginLeft: spacing['2'],
  },
  viewOriginalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing['4'],
  },
  viewOriginalText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
  },
  originalImageContainer: {
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing['4'],
  },
  originalImage: {
    width: '100%',
    height: 400,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
    marginTop: spacing['2'],
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    backgroundColor: colors.green[100],
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  savedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    color: colors.green[600],
  },
  newAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
    backgroundColor: colors.purple[600],
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    ...shadows.md,
  },
  newAnalysisText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});

export default TestAnalyzerScreen;
