/**
 * MediVault AI - Lab Test Detail Screen
 * Full detailed view of a lab test analysis result
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  FlaskConical,
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
  Trash2,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { useRecordStore } from '../store/useRecordStore';
import { LabTestAnalysis, TestParameter } from '../types';

type LabTestDetailRouteParams = {
  LabTestDetail: { labTestId: string };
};

const LabTestDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<LabTestDetailRouteParams, 'LabTestDetail'>>();
  const { t } = useTranslation();
  const { labTestId } = route.params;
  
  const { getLabTestRecordById, deleteLabTestRecord } = useRecordStore();
  const labTestRecord = getLabTestRecordById(labTestId);
  
  const [showOriginal, setShowOriginal] = useState(false);

  if (!labTestRecord) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('labDetail.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('labDetail.recordNotFound')}</Text>
        </View>
      </View>
    );
  }

  const { analysis } = labTestRecord;

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

  const conditionColors = getConditionColor(analysis.conditionAssessment);

  const handleDelete = async () => {
    try {
      await deleteLabTestRecord(labTestId);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting lab test:', error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('labDetail.title')}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={20} color={colors.red[500]} />
        </TouchableOpacity>
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
                    <Text style={styles.paramValueLabel}>{t('labDetail.result')}</Text>
                    <Text style={[styles.paramValue, { color: statusColors.text }]}>
                      {param.value} {param.unit}
                    </Text>
                  </View>
                  <View style={styles.paramValueItem}>
                    <Text style={styles.paramValueLabel}>{t('labDetail.reference')}</Text>
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
            source={{ uri: `data:image/jpeg;base64,${labTestRecord.imageUrl}` }}
            style={styles.originalImage}
            resizeMode="contain"
          />
        </View>
      )}

      <View style={{ height: spacing['24'] }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing['6'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing['3'],
    marginBottom: spacing['4'],
  },
  backButton: {
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
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  // Hero Card
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
  // Condition Card
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
  // Summary Card
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
  // Section
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
  // Finding
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
  // Param Card
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
  // Recommendation
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
  // Original Image
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
});

export default LabTestDetailScreen;
