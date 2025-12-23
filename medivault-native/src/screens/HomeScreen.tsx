/**
 * MediVault AI - Home Screen
 * Dashboard with stats, recent records, and quick actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Activity,
  FileText,
  FlaskConical,
  Pill,
  ChevronRight,
  Calendar,
  FileBadge,
  Users,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { Card, EmptyState, LanguageToggle } from '../components/common';
import { useRecordStore } from '../store/useRecordStore';
import { useAuthStore } from '../store/useAuthStore';
import { getGreetingKey } from '../utils/dateUtils';
import { DOCUMENT_TYPE_CONFIG } from '../constants';
import { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'Home'>;

/**
 * Home screen component
 */
const HomeScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const { 
    records, 
    isLoading, 
    loadRecords,
    getStats 
  } = useRecordStore();
  
  const { user, userProfile } = useAuthStore();

  const stats = getStats();
  const recentRecords = records.slice(0, 5);
  
  // Get display name for greeting
  const displayName = userProfile?.displayName || user?.displayName || 'there';
  
  // Get localized greeting
  const greetingKey = getGreetingKey();
  const greeting = t(`greeting.${greetingKey}`);

  const handleScan = () => {
    navigation.navigate('Scan' as never);
  };

  const handleViewRecord = (recordId: string) => {
    navigation.navigate('Detail', { recordId } as never);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing['4'] },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadRecords}
          tintColor={colors.primary[600]}
        />
      }
    >
      {/* Language Toggle - Top Right */}
      <View style={styles.languageToggleContainer}>
        <LanguageToggle size="medium" />
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.heroContent}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroGreeting}>{greeting},</Text>
              <Text style={styles.heroName}>{displayName}</Text>
            </View>
            <View style={styles.heroIcon}>
              <Activity size={24} color={colors.white} />
            </View>
          </View>

          {/* Latest Update */}
          <View style={styles.latestUpdate}>
            <View style={styles.latestIcon}>
              <FileBadge size={20} color={colors.white} />
            </View>
            <View style={styles.latestText}>
              <Text style={styles.latestLabel}>{t('home.latestUpdate')}</Text>
              <Text style={styles.latestTitle} numberOfLines={1}>
                {records[0]?.analysis.title || t('home.noRecordsYet')}
              </Text>
            </View>
          </View>

          {/* Scan Button */}
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={handleScan}
            activeOpacity={0.9}
          >
            <Camera size={20} color={colors.primary[700]} />
            <Text style={styles.scanButtonText}>{t('home.scanNewDocument')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Access Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.quickAccess')}</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('History' as never)}
            activeOpacity={0.8}
          >
            <View style={[styles.statIcon, { backgroundColor: colors.orange[50] }]}>
              <FileText size={22} color={colors.orange[500]} />
            </View>
            <Text style={styles.statNumber}>{stats.totalRecords}</Text>
            <Text style={styles.statLabel}>{t('home.notebook')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('TestAnalyzer' as never)}
            activeOpacity={0.8}
          >
            <View style={[styles.statIcon, { backgroundColor: colors.purple[50] }]}>
              <FlaskConical size={22} color={colors.purple[500]} />
            </View>
            <Text style={styles.statNumber}>{stats.labTestRecords}</Text>
            <Text style={styles.statLabel}>{t('home.testAnalyzer')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('FamilyMembers' as never)}
            activeOpacity={0.8}
          >
            <View style={[styles.statIcon, { backgroundColor: colors.green[100] }]}>
              <Users size={22} color={colors.green[600]} />
            </View>
            <Text style={styles.statNumber}>•••</Text>
            <Text style={styles.statLabel}>{t('home.familyMembers')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, styles.wideCard]}
            onPress={() => navigation.navigate('Meds' as never)}
            activeOpacity={0.8}
          >
            <View style={styles.wideCardContent}>
              <View style={[styles.statIcon, { backgroundColor: colors.blue[50] }]}>
                <Pill size={22} color={colors.blue[500]} />
              </View>
              <View style={styles.wideCardText}>
                <Text style={styles.statNumber}>{stats.totalMedications}</Text>
                <Text style={styles.statLabel}>{t('home.activeMedicines')}</Text>
              </View>
              <View style={styles.wideCardArrow}>
                <ChevronRight size={20} color={colors.white} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.recentHistory')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History' as never)}>
            <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {recentRecords.length === 0 ? (
          <EmptyState
            icon={<Camera size={24} color={colors.gray[300]} />}
            title={t('home.noRecordsFound')}
            message={t('home.scanFirstDocument')}
          />
        ) : (
          <View style={styles.recordsList}>
            {recentRecords.map((record) => {
              const config = DOCUMENT_TYPE_CONFIG[record.analysis.documentType];
              return (
                <TouchableOpacity
                  key={record.id}
                  style={styles.recordCard}
                  onPress={() => handleViewRecord(record.id)}
                  activeOpacity={0.8}
                >
                  <View 
                    style={[
                      styles.recordIcon, 
                      { backgroundColor: config.bgColor }
                    ]}
                  >
                    <Text style={[styles.recordIconText, { color: config.textColor }]}>
                      {config.label}
                    </Text>
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordTitle} numberOfLines={1}>
                      {record.analysis.title}
                    </Text>
                    <View style={styles.recordMeta}>
                      <Calendar size={12} color={colors.gray[400]} />
                      <Text style={styles.recordDate}>{record.analysis.date}</Text>
                      <Text style={styles.recordDot}>•</Text>
                      <Text style={styles.recordDoctor} numberOfLines={1}>
                        {record.analysis.doctorName || 'Unknown Doctor'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recordArrow}>
                    <ChevronRight size={16} color={colors.gray[400]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
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
    paddingBottom: spacing['24'],
  },
  
  // Language Toggle
  languageToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing['4'],
  },

  // Hero
  heroCard: {
    backgroundColor: colors.primary[700],
    borderRadius: borderRadius['4xl'],
    padding: spacing['8'],
    marginBottom: spacing['8'],
    overflow: 'hidden',
    ...shadows.xl,
    shadowColor: colors.primary[600],
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 60,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing['6'],
  },
  heroGreeting: {
    fontSize: fontSize.base,
    color: colors.primary[100],
    marginBottom: spacing['1'],
  },
  heroName: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  heroIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: spacing['2'],
    borderRadius: borderRadius.xl,
  },
  latestUpdate: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['4'],
    marginBottom: spacing['6'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  latestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestText: {
    flex: 1,
  },
  latestLabel: {
    fontSize: fontSize.xs,
    color: colors.primary[100],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: fontWeight.semiBold,
  },
  latestTitle: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.semiBold,
    marginTop: 2,
  },
  scanButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing['4'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
  },
  scanButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },

  // Sections
  section: {
    marginBottom: spacing['8'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['4'],
    paddingHorizontal: spacing['1'],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.primary[600],
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['4'],
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['5'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  wideCard: {
    flexBasis: '100%',
  },
  wideCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wideCardText: {
    flex: 1,
    marginLeft: spacing['4'],
  },
  wideCardArrow: {
    backgroundColor: colors.blue[500],
    padding: spacing['2'],
    borderRadius: borderRadius.xl,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3'],
  },
  statNumber: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing['1'],
  },

  // Records List
  recordsList: {
    gap: spacing['4'],
  },
  recordCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['4'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  recordIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIconText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginTop: spacing['1'],
  },
  recordDate: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  recordDot: {
    fontSize: fontSize.xs,
    color: colors.gray[300],
  },
  recordDoctor: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  recordArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
