/**
 * MediVault AI - Meds Screen
 * Grid view of all medications with pill count tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Pill,
  Droplets,
  Tablets,
  CheckCircle2,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { EmptyState } from '../components/common';
import { useRecordStore } from '../store/useRecordStore';
import { MainTabScreenProps } from '../navigation/types';
import { formatNumber } from '../localization';

type Props = MainTabScreenProps<'Meds'>;

// Progress bar component for pill count
const PillProgressBar: React.FC<{ remaining: number; total: number }> = ({ remaining, total }) => {
  const progress = total > 0 ? (remaining / total) * 100 : 0;
  
  const getProgressColor = () => {
    if (progress > 50) return '#00A5A5';
    if (progress > 25) return '#F5A623';
    return '#E74C3C';
  };
  
  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${progress}%`, backgroundColor: getProgressColor() },
          ]} 
        />
      </View>
    </View>
  );
};

const MedsScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { getAllMedications, loadRecords } = useRecordStore();
  
  const [medications, setMedications] = useState(getAllMedications());

  // Refresh medications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshMedications = async () => {
        await loadRecords();
        setMedications(getAllMedications());
      };
      refreshMedications();
    }, [])
  );

  const getMedIcon = (type?: string) => {
    if (type?.toLowerCase().includes('syrup')) return Droplets;
    if (type?.toLowerCase().includes('capsule')) return Pill;
    return Tablets;
  };

  const handleMedPress = (med: any, index: number) => {
    navigation.navigate('MedDetail', { 
      medication: med, 
      sourceId: med.sourceId 
    } as never);
  };

  // Get pill count display values
  const getPillInfo = (med: any) => {
    const total = med.totalPills || 30; // Default to 30 pills
    const remaining = med.pillsRemaining ?? total;
    return { total, remaining };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing['4'] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('meds.title')}</Text>
          <Text style={styles.subtitle}>
            {formatNumber(medications.length)} {t('meds.activePrescriptions')}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Scan' as never)}
        >
          <Plus size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('meds.searchMedicines')}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Medications Grid */}
      {medications.length === 0 ? (
        <EmptyState
          icon={<Pill size={32} color={colors.blue[500]} />}
          title={t('meds.noMeds')}
          message={t('meds.scanToAdd')}
        />
      ) : (
        <View style={styles.grid}>
          {medications.map((med, index) => {
            const IconComponent = getMedIcon(med.type);
            const { total, remaining } = getPillInfo(med);
            return (
              <TouchableOpacity
                key={`${med.name}-${index}`}
                style={styles.medCard}
                onPress={() => handleMedPress(med, index)}
                activeOpacity={0.8}
              >
                {med.purchaseProofImage && (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle2 size={16} color={colors.green[500]} />
                  </View>
                )}
                {/* Display medicine image if available, otherwise show icon */}
                {med.pricing?.imageUrl ? (
                  <View style={styles.medImageContainer}>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${med.pricing.imageUrl}` }}
                      style={styles.medImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View style={styles.medIcon}>
                    <IconComponent size={32} color={colors.blue[500]} />
                  </View>
                )}
                <Text style={styles.medName} numberOfLines={1}>
                  {med.name}
                </Text>
                <Text style={styles.medDosage}>{med.dosage}</Text>
                {med.purpose && (
                  <View style={styles.purposeContainer}>
                    <Text style={styles.purposeLabel}>{t('meds.treats')}</Text>
                    <Text style={styles.purposeText} numberOfLines={1}>
                      {med.purpose}
                    </Text>
                  </View>
                )}
                
                {/* Pill Count Progress Bar */}
                <PillProgressBar remaining={remaining} total={total} />
                <Text style={styles.pillsLeft}>{formatNumber(remaining)} {t('meds.pillsLeft')}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing['1'],
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[900],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    marginBottom: spacing['6'],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing['3'],
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['4'],
  },
  medCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['4'],
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing['3'],
    right: spacing['3'],
  },
  medIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.blue[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3'],
  },
  medImageContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing['3'],
    backgroundColor: colors.gray[50],
    ...shadows.sm,
  },
  medImage: {
    width: '100%',
    height: '100%',
  },
  medName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  medDosage: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    color: colors.text.secondary,
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    borderRadius: borderRadius.lg,
    marginTop: spacing['2'],
  },
  purposeContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing['3'],
    paddingTop: spacing['3'],
    width: '100%',
  },
  purposeLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  purposeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.blue[600],
    textAlign: 'center',
    marginTop: spacing['1'],
  },
  // Progress Bar Styles
  progressBarContainer: {
    width: '100%',
    marginTop: spacing['3'],
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Pills Left Text
  pillsLeft: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing['2'],
  },
});

export default MedsScreen;
