/**
 * MediVault AI - Med Detail Screen
 * Detailed view of a single medication
 */

import React from 'react';
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
import {
  ChevronLeft,
  Pill,
  Droplets,
  Tablets,
  Clock,
  Calendar,
  AlertTriangle,
  Activity,
  FileText,
  Sparkles,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { RootStackParamList } from '../navigation/types';

type MedDetailRouteProp = RouteProp<RootStackParamList, 'MedDetail'>;

const MedDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<MedDetailRouteProp>();
  
  const { medication, sourceId } = route.params;

  const getMedIcon = (type?: string) => {
    if (type?.toLowerCase().includes('syrup') || type?.toLowerCase().includes('liquid')) {
      return Droplets;
    }
    if (type?.toLowerCase().includes('capsule')) {
      return Pill;
    }
    return Tablets;
  };

  const IconComponent = getMedIcon(medication.type);

  const handleViewSource = () => {
    if (sourceId) {
      navigation.navigate('Detail', { recordId: sourceId } as never);
    }
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
          <Text style={styles.headerTitle}>Medication Details</Text>
          <Text style={styles.headerSubtitle}>{medication.type || 'Medication'}</Text>
        </View>
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <IconComponent size={48} color={colors.blue[500]} />
        </View>
        <Text style={styles.medName}>{medication.name}</Text>
        <View style={styles.dosageBadge}>
          <Text style={styles.dosageText}>{medication.dosage}</Text>
        </View>
      </View>

      {/* Schedule Info */}
      <View style={styles.scheduleCard}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.scheduleGrid}>
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleIcon}>
              <Clock size={20} color={colors.primary[600]} />
            </View>
            <Text style={styles.scheduleLabel}>Frequency</Text>
            <Text style={styles.scheduleValue}>{medication.frequency}</Text>
          </View>
          {medication.duration && (
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleIcon}>
                <Calendar size={20} color={colors.purple[600]} />
              </View>
              <Text style={styles.scheduleLabel}>Duration</Text>
              <Text style={styles.scheduleValue}>{medication.duration}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Purpose */}
      {medication.purpose && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={[styles.infoIcon, { backgroundColor: colors.green[100] }]}>
              <Activity size={18} color={colors.green[600]} />
            </View>
            <Text style={styles.infoTitle}>Purpose</Text>
          </View>
          <Text style={styles.infoText}>{medication.purpose}</Text>
        </View>
      )}

      {/* Side Effects */}
      {medication.sideEffects && (
        <View style={[styles.infoCard, styles.warningCard]}>
          <View style={styles.infoHeader}>
            <View style={[styles.infoIcon, { backgroundColor: colors.amber[50] }]}>
              <AlertTriangle size={18} color={colors.amber[400]} />
            </View>
            <Text style={[styles.infoTitle, { color: colors.amber[900] }]}>
              Potential Side Effects
            </Text>
          </View>
          <Text style={[styles.infoText, { color: colors.amber[800] }]}>
            {medication.sideEffects}
          </Text>
        </View>
      )}

      {/* AI Insight */}
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Sparkles size={16} color={colors.white} />
          <Text style={styles.aiLabel}>AI Insight</Text>
        </View>
        <Text style={styles.aiText}>
          Take {medication.name} {medication.frequency.toLowerCase()}
          {medication.duration ? ` for ${medication.duration}` : ''}.
          {medication.purpose ? ` This medication helps with ${medication.purpose.toLowerCase()}.` : ''}
          {medication.sideEffects ? ' Watch for any unusual reactions and consult your doctor if needed.' : ''}
        </Text>
      </View>

      {/* Purchase Proof Image */}
      {medication.purchaseProofImage && (
        <View style={styles.proofSection}>
          <Text style={styles.sectionTitle}>Purchase Proof</Text>
          <View style={styles.proofImageContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${medication.purchaseProofImage}` }}
              style={styles.proofImage}
              resizeMode="contain"
            />
          </View>
        </View>
      )}

      {/* View Source Prescription */}
      {sourceId && (
        <TouchableOpacity style={styles.sourceButton} onPress={handleViewSource}>
          <FileText size={18} color={colors.text.secondary} />
          <Text style={styles.sourceButtonText}>View Original Prescription</Text>
        </TouchableOpacity>
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
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['4xl'],
    padding: spacing['8'],
    alignItems: 'center',
    marginBottom: spacing['6'],
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: borderRadius['3xl'],
    backgroundColor: colors.blue[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['4'],
  },
  medName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing['3'],
  },
  dosageBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  dosageText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  scheduleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['6'],
    marginBottom: spacing['4'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['4'],
  },
  scheduleGrid: {
    flexDirection: 'row',
    gap: spacing['4'],
  },
  scheduleItem: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    alignItems: 'center',
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2'],
    ...shadows.sm,
  },
  scheduleLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing['1'],
  },
  scheduleValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['5'],
    marginBottom: spacing['4'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  warningCard: {
    backgroundColor: colors.amber[50],
    borderColor: colors.amber[100],
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['3'],
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  aiCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius['3xl'],
    padding: spacing['5'],
    marginBottom: spacing['4'],
    ...shadows.lg,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['3'],
  },
  aiLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiText: {
    fontSize: fontSize.sm,
    color: colors.gray[200],
    lineHeight: 22,
  },
  proofSection: {
    marginBottom: spacing['4'],
  },
  proofImageContainer: {
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  proofImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray[50],
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  sourceButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
  },
});

export default MedDetailScreen;
