/**
 * MediVault AI - Detail Screen
 * Detailed view of a medical record analysis
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarPlus,
  Stethoscope,
  FlaskConical,
  Activity,
  CheckCircle2,
  Pill,
  Clock,
  Eye,
  Trash2,
  Sparkles,
  Bell,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { useRecordStore } from '../store/useRecordStore';
import { promptAndAddToCalendar } from '../services/calendarService';
import { RootStackParamList } from '../navigation/types';

type DetailRouteProp = RouteProp<RootStackParamList, 'Detail'>;

// Helper function to parse duration and calculate days
const parseDuration = (duration?: string): number | null => {
  if (!duration) return null;
  
  const lowerDuration = duration.toLowerCase();
  const match = lowerDuration.match(/(\d+)\s*(day|days|week|weeks|month|months)/);
  
  if (!match) return null;
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  if (unit.startsWith('week')) {
    return value * 7;
  } else if (unit.startsWith('month')) {
    return value * 30;
  }
  return value; // days
};

// Helper function to calculate progress percentage
const calculateProgress = (createdAt: number, duration?: string): { progress: number; daysElapsed: number; totalDays: number } | null => {
  const totalDays = parseDuration(duration);
  if (!totalDays) return null;
  
  const startDate = new Date(createdAt);
  const currentDate = new Date();
  const msElapsed = currentDate.getTime() - startDate.getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  
  const progress = Math.min(Math.max(daysElapsed / totalDays, 0), 1);
  
  return {
    progress,
    daysElapsed: Math.min(daysElapsed, totalDays),
    totalDays,
  };
};

const DetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<DetailRouteProp>();
  const { t } = useTranslation();
  const { getRecordById, deleteRecord } = useRecordStore();
  const [showOriginal, setShowOriginal] = useState(false);

  const record = getRecordById(route.params.recordId);

  if (!record) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>{t('detail.recordNotFound')}</Text>
      </View>
    );
  }

  const { analysis } = record;

  const handleDelete = () => {
    Alert.alert(
      t('detail.deleteRecord'),
      t('detail.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteRecord(record.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('detail.analysisReport')}</Text>
          <Text style={styles.headerSubtitle}>{analysis.documentType}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={20} color={colors.red[500]} />
        </TouchableOpacity>
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={[
            styles.heroIcon,
            { backgroundColor: analysis.documentType === 'Lab Report' 
              ? colors.purple[500] 
              : colors.primary[500] 
            }
          ]}>
            {analysis.documentType === 'Lab Report' 
              ? <FlaskConical size={32} color={colors.white} />
              : <Stethoscope size={32} color={colors.white} />
            }
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{analysis.title}</Text>
            <View style={styles.heroMeta}>
              <Calendar size={14} color={colors.text.secondary} />
              <Text style={styles.heroDate}>{analysis.date}</Text>
            </View>
          </View>
        </View>

        <View style={styles.heroDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('detail.doctor')}</Text>
            <Text style={styles.detailValue}>{analysis.doctorName || t('detail.notListed')}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('detail.facility')}</Text>
            <Text style={styles.detailValue}>{analysis.facilityName || t('detail.notListed')}</Text>
          </View>
        </View>
      </View>

      {/* AI Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Sparkles size={16} color={colors.white} />
          <Text style={styles.summaryLabel}>{t('detail.aiInsight')}</Text>
        </View>
        <Text style={styles.summaryText}>{analysis.summary}</Text>
      </View>

      {/* Diagnosis */}
      {analysis.diagnosis.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={18} color={colors.amber[800]} />
            <Text style={[styles.sectionTitle, { color: colors.amber[800] }]}>{t('detail.diagnosis')}</Text>
          </View>
          <View style={styles.tagContainer}>
            {analysis.diagnosis.map((d, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Next Steps */}
      {analysis.nextSteps.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle2 size={18} color={colors.indigo[800]} />
            <Text style={[styles.sectionTitle, { color: colors.indigo[800] }]}>{t('detail.plan')}</Text>
          </View>
          {analysis.nextSteps.map((step, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Medications */}
      {analysis.medications.length > 0 && (
        <View style={styles.prescriptionsSection}>
          <TouchableOpacity 
            style={styles.prescriptionsSectionHeader}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Meds' })}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Pill size={18} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>{t('detail.prescriptions')}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{analysis.medications.length}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.gray[400]} />
          </TouchableOpacity>
          {analysis.medications.map((med, i) => {
            const progressData = calculateProgress(record.createdAt, med.duration);
            
            return (
              <View key={i} style={styles.medCard}>
                <View style={styles.medIcon}>
                  <Pill size={24} color={colors.blue[500]} />
                </View>
                <View style={styles.medContent}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <View style={styles.medMeta}>
                    <View style={styles.medMetaItem}>
                      <Activity size={12} color={colors.gray[500]} />
                      <Text style={styles.medMetaText}>{med.dosage}</Text>
                    </View>
                    <View style={styles.medMetaItem}>
                      <Clock size={12} color={colors.gray[500]} />
                      <Text style={styles.medMetaText}>{med.frequency}</Text>
                    </View>
                  </View>
                  {progressData && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarBackground}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { width: `${progressData.progress * 100}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {t('detail.daysTaken', { elapsed: progressData.daysElapsed, total: progressData.totalDays })}
                      </Text>
                    </View>
                  )}
                </View>
                {med.duration && (
                  <Text style={styles.medDuration}>{med.duration}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Add to Calendar Button - Only for prescriptions with medications */}
      {analysis.documentType === 'Prescription' && analysis.medications.length > 0 && (
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => promptAndAddToCalendar(analysis.medications)}
        >
          <CalendarPlus size={20} color={colors.white} />
          <Text style={styles.calendarButtonText}>{t('detail.addReminders')}</Text>
          <Bell size={16} color={colors.primary[200]} />
        </TouchableOpacity>
      )}

      {/* View Original */}
      <TouchableOpacity
        style={styles.viewOriginalButton}
        onPress={() => setShowOriginal(!showOriginal)}
      >
        <Eye size={18} color={colors.text.secondary} />
        <Text style={styles.viewOriginalText}>
          {showOriginal ? t('detail.hideOriginal') : t('detail.viewOriginal')}
        </Text>
      </TouchableOpacity>

      {showOriginal && (
        <View style={styles.originalImageContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${record.imageUrl}` }}
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
    marginBottom: spacing['6'],
  },
  backButton: {
    padding: spacing['2'],
    marginRight: spacing['3'],
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: spacing['2'],
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['4xl'],
    padding: spacing['6'],
    marginBottom: spacing['6'],
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
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
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
  summaryCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius['4xl'],
    padding: spacing['6'],
    marginBottom: spacing['6'],
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
  prescriptionsSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['4xl'],
    padding: spacing['6'],
    marginBottom: spacing['4'],
    marginHorizontal: spacing['1'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  prescriptionsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['4'],
    paddingVertical: spacing['2'],
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    flex: 1,
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
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['2'],
  },
  tag: {
    backgroundColor: colors.amber[50],
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1.5'],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.amber[100],
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.amber[800],
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing['3'],
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.indigo[400],
    marginTop: 6,
    marginRight: spacing['3'],
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.indigo[800],
    lineHeight: 20,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    marginBottom: spacing['3'],
  },
  medIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.blue[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['4'],
  },
  medContent: {
    flex: 1,
  },
  medName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['2'],
  },
  medMeta: {
    flexDirection: 'row',
    gap: spacing['4'],
  },
  medMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
    backgroundColor: colors.white,
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    borderRadius: borderRadius.md,
  },
  medMetaText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    color: colors.text.secondary,
  },
  progressContainer: {
    marginTop: spacing['3'],
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing['1'],
  },
  medDuration: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    borderRadius: borderRadius.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['3'],
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    marginBottom: spacing['3'],
    ...shadows.md,
    shadowColor: colors.primary[600],
  },
  calendarButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
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
  },
  viewOriginalText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
  },
  originalImageContainer: {
    marginTop: spacing['4'],
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  originalImage: {
    width: '100%',
    height: 400,
  },
});

export default DetailScreen;
