/**
 * MediVault AI - Schedule Screen
 * Timeline view for medication schedule with pill confirmation
 * Persists taken medications to Firebase
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Clock, Pill, Tablets, Check } from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { useRecordStore } from '../store/useRecordStore';
import { getDayName, getDayNumber, getFullDateString } from '../utils/dateUtils';
import { MainTabScreenProps } from '../navigation/types';
import { MedicationWithSource } from '../types';
import { formatNumber } from '../localization';

type Props = MainTabScreenProps<'Schedule'>;

/**
 * Get date string in YYYY-MM-DD format for a given day offset
 */
const getDateKey = (dayOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().split('T')[0];
};

const ScheduleScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(0);
  
  // Get store functions and state
  const { 
    getAllMedications, 
    markMedicationTaken, 
    isMedicationTaken 
  } = useRecordStore();
  
  const medications = getAllMedications();
  const currentDate = getFullDateString(selectedDay);
  const dateKey = useMemo(() => getDateKey(selectedDay), [selectedDay]);

  // Check if a medication has been taken for a specific time slot
  const checkMedicationTaken = (medName: string, timeSlot: string): boolean => {
    return isMedicationTaken(medName, timeSlot, dateKey);
  };

  // Handle confirming medication taken
  const handleConfirmMedication = async (
    med: MedicationWithSource, 
    timeSlot: 'morning' | 'afternoon' | 'evening'
  ) => {
    const alreadyTaken = checkMedicationTaken(med.name, timeSlot);
    
    if (alreadyTaken) {
      Alert.alert(
        t('schedule.alerts.alreadyTakenTitle'),
        t('schedule.alerts.alreadyTakenMessage', { name: med.name })
      );
      return;
    }

    Alert.alert(
      t('schedule.alerts.confirmTitle'),
      t('schedule.alerts.confirmMessage', { name: med.name, dosage: med.dosage }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              // Mark as taken in store (persists to Firebase)
              await markMedicationTaken(med, timeSlot, dateKey);
            } catch (error) {
              Alert.alert(t('common.error'), t('schedule.alerts.updateError'));
            }
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
        { paddingTop: insets.top + spacing['4'] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('schedule.title')}</Text>
        <Text style={styles.subtitle}>{currentDate}</Text>
      </View>

      {/* Calendar Strip */}
      <View style={styles.calendarStrip}>
        {[-2, -1, 0, 1, 2].map((offset) => (
          <TouchableOpacity
            key={offset}
            style={[
              styles.dayButton,
              selectedDay === offset && styles.dayButtonActive,
            ]}
            onPress={() => setSelectedDay(offset)}
          >
            <Text
              style={[
                styles.dayName,
                selectedDay === offset && styles.dayNameActive,
              ]}
            >
              {t(`days.${getDayName(offset).toLowerCase()}`)}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                selectedDay === offset && styles.dayNumberActive,
              ]}
            >
              {formatNumber(getDayNumber(offset))}
            </Text>
            {offset === 0 && selectedDay !== 0 && (
              <View style={styles.todayDot} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        <View style={styles.timelineHeader}>
          <Clock size={18} color={colors.text.primary} />
          <Text style={styles.timelineTitle}>{t('schedule.timeline')}</Text>
        </View>

        {medications.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyText}>{t('schedule.noMedications')}</Text>
          </View>
        ) : (
          <>
            {/* Morning Slot */}
            <View style={[styles.timeSlot, { borderLeftColor: colors.orange[300] }]}>
              <View style={styles.timeLabel}>
                <Text style={styles.time}>{formatNumber(8)}:{formatNumber('00')}</Text>
                <Text style={styles.period}>{t('schedule.am')}</Text>
              </View>
              <View style={styles.timeContent}>
                {medications.map((med, i) => {
                  const taken = checkMedicationTaken(med.name, 'morning');
                  return (
                    <View key={`morning-${med.name}-${i}`} style={styles.medItem}>
                      <View style={[styles.medItemIcon, { backgroundColor: colors.blue[50] }]}>
                        <Pill size={14} color={colors.blue[500]} />
                      </View>
                      <View style={styles.medItemText}>
                        <Text style={[styles.medItemName, taken && styles.medItemNameTaken]}>
                          {med.name}
                        </Text>
                        <Text style={styles.medItemDose}>{med.dosage} • {t('schedule.withBreakfast')}</Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.checkbox, taken && styles.checkboxChecked]}
                        onPress={() => handleConfirmMedication(med, 'morning')}
                        disabled={taken}
                      >
                        {taken && <Check size={14} color={colors.white} />}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Afternoon Slot */}
            <View style={[styles.timeSlot, { borderLeftColor: colors.blue[500] }]}>
              <View style={styles.timeLabel}>
                <Text style={styles.time}>{formatNumber(1)}:{formatNumber('00')}</Text>
                <Text style={styles.period}>{t('schedule.pm')}</Text>
              </View>
              <View style={styles.timeContent}>
                {medications.slice(0, Math.ceil(medications.length / 2)).map((med, i) => {
                  const taken = checkMedicationTaken(med.name, 'afternoon');
                  return (
                    <View key={`afternoon-${med.name}-${i}`} style={styles.medItem}>
                      <View style={[styles.medItemIcon, { backgroundColor: colors.blue[50] }]}>
                        <Tablets size={14} color={colors.blue[500]} />
                      </View>
                      <View style={styles.medItemText}>
                        <Text style={[styles.medItemName, taken && styles.medItemNameTaken]}>
                          {med.name}
                        </Text>
                        <Text style={styles.medItemDose}>{med.dosage} • {t('schedule.afterLunch')}</Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.checkbox, taken && styles.checkboxChecked]}
                        onPress={() => handleConfirmMedication(med, 'afternoon')}
                        disabled={taken}
                      >
                        {taken && <Check size={14} color={colors.white} />}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Evening Slot */}
            <View style={[styles.timeSlot, { borderLeftColor: colors.indigo[500] }]}>
              <View style={styles.timeLabel}>
                <Text style={styles.time}>{formatNumber(8)}:{formatNumber('00')}</Text>
                <Text style={styles.period}>{t('schedule.pm')}</Text>
              </View>
              <View style={styles.timeContent}>
                {medications.map((med, i) => {
                  const taken = checkMedicationTaken(med.name, 'evening');
                  return (
                    <View key={`evening-${med.name}-${i}`} style={styles.medItem}>
                      <View style={[styles.medItemIcon, { backgroundColor: colors.indigo[50] }]}>
                        <Tablets size={14} color={colors.indigo[500]} />
                      </View>
                      <View style={styles.medItemText}>
                        <Text style={[styles.medItemName, taken && styles.medItemNameTaken]}>
                          {med.name}
                        </Text>
                        <Text style={styles.medItemDose}>{med.dosage} • {t('schedule.afterDinner')}</Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.checkbox, taken && styles.checkboxChecked]}
                        onPress={() => handleConfirmMedication(med, 'evening')}
                        disabled={taken}
                      >
                        {taken && <Check size={14} color={colors.white} />}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
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
  header: {
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
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius['4xl'],
    padding: spacing['4'],
    marginBottom: spacing['6'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing['2'],
    borderRadius: borderRadius['2xl'],
  },
  dayButtonActive: {
    backgroundColor: colors.primary[600],
    ...shadows.lg,
    shadowColor: colors.primary[600],
  },
  dayName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: spacing['2'],
  },
  dayNameActive: {
    color: colors.primary[100],
  },
  dayNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  dayNumberActive: {
    color: colors.white,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary[500],
    marginTop: spacing['1'],
  },
  timeline: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['4'],
  },
  timelineTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  emptyTimeline: {
    padding: spacing['8'],
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.tertiary,
  },
  timeSlot: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['5'],
    marginBottom: spacing['4'],
    borderLeftWidth: 4,
    flexDirection: 'row',
    ...shadows.sm,
  },
  timeLabel: {
    alignItems: 'center',
    minWidth: 48,
    marginRight: spacing['4'],
  },
  time: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  period: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  timeContent: {
    flex: 1,
    gap: spacing['3'],
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  medItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  medItemText: {
    flex: 1,
  },
  medItemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  medItemNameTaken: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  medItemDose: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.green[500],
    borderColor: colors.green[500],
  },
});

export default ScheduleScreen;
