/**
 * MediVault AI - History Screen
 * List of all scanned medical documents
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  FileText,
  Pill,
  FlaskConical,
  Activity,
  ChevronRight,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { EmptyState } from '../components/common';
import { useRecordStore } from '../store/useRecordStore';
import { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'History'>;

const HistoryScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { records } = useRecordStore();

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'Prescription':
        return Pill;
      case 'Lab Report':
        return FlaskConical;
      default:
        return Activity;
    }
  };

  const getDocColor = (type: string) => {
    switch (type) {
      case 'Prescription':
        return { bg: colors.blue[100], text: colors.blue[600] };
      case 'Lab Report':
        return { bg: colors.purple[100], text: colors.purple[600] };
      default:
        return { bg: colors.primary[100], text: colors.primary[600] };
    }
  };

  const handleRecordPress = (recordId: string) => {
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
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notebook</Text>
        <Text style={styles.subtitle}>All Documents</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Records List */}
      {records.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} color={colors.gray[300]} />}
          title="Your medical notebook is empty"
          message="Scan a document to get started"
        />
      ) : (
        <View style={styles.recordsList}>
          {records.map((record) => {
            const Icon = getDocIcon(record.analysis.documentType);
            const colors_doc = getDocColor(record.analysis.documentType);
            
            return (
              <TouchableOpacity
                key={record.id}
                style={styles.recordCard}
                onPress={() => handleRecordPress(record.id)}
                activeOpacity={0.8}
              >
                <View style={styles.recordHeader}>
                  <View style={[styles.recordIcon, { backgroundColor: colors_doc.bg }]}>
                    <Icon size={20} color={colors_doc.text} />
                  </View>
                  <View style={styles.recordTitleContainer}>
                    <Text style={styles.recordTitle}>{record.analysis.title}</Text>
                    <Text style={styles.recordSource}>
                      {record.analysis.facilityName || record.analysis.doctorName || 'Unknown Source'}
                    </Text>
                  </View>
                  <Text style={styles.recordDate}>{record.analysis.date}</Text>
                </View>
                
                <View style={styles.recordSummary}>
                  <Text style={styles.summaryText} numberOfLines={2}>
                    {record.analysis.summary}
                  </Text>
                </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['4'],
    marginBottom: spacing['6'],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing['3'],
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  recordsList: {
    gap: spacing['4'],
  },
  recordCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['6'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing['4'],
  },
  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  recordTitleContainer: {
    flex: 1,
  },
  recordTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  recordSource: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing['1'],
  },
  recordDate: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  recordSummary: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing['3'],
  },
  summaryText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

export default HistoryScreen;
