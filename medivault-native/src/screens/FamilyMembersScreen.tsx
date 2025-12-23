/**
 * Family Members Management Screen
 * Allows users to manage family member profiles
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Plus, Edit2, Trash2, Star, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, shadows, textStyles } from '../theme';
import { Header } from '../components/common';
import { useAuth } from '../store/useAuthStore';
import { 
  useFamilyMembers, 
  useActiveMember, 
  useFamilyActions,
  getAvatarColor 
} from '../store/useFamilyStore';
import { FamilyMember } from '../types';

export const FamilyMembersScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const familyMembers = useFamilyMembers();
  const activeMember = useActiveMember();
  const {
    addFamilyMember,
    updateMember,
    removeMember,
    setActiveMember,
    setPrimary,
    loadFamilyMembers,
  } = useFamilyActions();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | undefined>();
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadFamilyMembers(user.uid);
    }
  }, [user?.uid]);

  const handleOpenModal = (member?: FamilyMember) => {
    if (member) {
      setEditingMember(member);
      setName(member.name);
      setRelationship(member.relationship);
      setDateOfBirth(member.dateOfBirth || '');
      setGender(member.gender);
      setBloodGroup(member.bloodGroup || '');
      setEmergencyContact(member.emergencyContact || '');
    } else {
      setEditingMember(null);
      setName('');
      setRelationship('');
      setDateOfBirth('');
      setGender(undefined);
      setBloodGroup('');
      setEmergencyContact('');
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingMember(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !relationship.trim()) {
      Alert.alert(t('common.error'), t('family.enterNameAndRelation'));
      return;
    }

    if (!user?.uid) return;

    setIsLoading(true);
    try {
      if (editingMember) {
        // Update existing member
        await updateMember(user.uid, editingMember.id, {
          name: name.trim(),
          relationship: relationship.trim(),
          dateOfBirth: dateOfBirth.trim() || undefined,
          gender: gender,
          bloodGroup: bloodGroup.trim() || undefined,
          emergencyContact: emergencyContact.trim() || undefined,
        });
        Alert.alert(t('common.success'), t('family.memberUpdated'));
      } else {
        // Add new member
        const isFirstMember = familyMembers.length === 0;
        await addFamilyMember(user.uid, {
          name: name.trim(),
          relationship: relationship.trim(),
          dateOfBirth: dateOfBirth.trim() || undefined,
          gender: gender,
          bloodGroup: bloodGroup.trim() || undefined,
          emergencyContact: emergencyContact.trim() || undefined,
          isPrimary: isFirstMember,
        });
        Alert.alert(t('common.success'), t('family.memberAdded'));
      }
      handleCloseModal();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('errors.apiError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (member: FamilyMember) => {
    Alert.alert(
      t('family.deleteMember'),
      t('family.deleteConfirm', { name: member.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            try {
              await removeMember(user.uid, member.id);
              Alert.alert(t('common.success'), t('family.memberDeleted'));
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('errors.apiError'));
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (member: FamilyMember) => {
    if (!user?.uid) return;
    try {
      await setPrimary(user.uid, member.id);
      Alert.alert(t('common.success'), t('family.nowPrimary', { name: member.name }));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('errors.apiError'));
    }
  };

  const handleSelectMember = async (member: FamilyMember) => {
    await setActiveMember(member);
    Alert.alert(t('common.success'), t('family.switchedTo', { name: member.name }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={t('family.title')} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('family.manageProfiles')}
          </Text>
          <Text style={styles.sectionDescription}>
            {t('family.description')}
          </Text>
        </View>

        {familyMembers.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.memberCard,
              activeMember?.id === member.id && styles.activeMemberCard,
            ]}
          >
            <TouchableOpacity
              style={styles.memberContent}
              onPress={() => handleSelectMember(member)}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: getAvatarColor(index) },
                ]}
              >
                <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
              </View>
              
              <View style={styles.memberInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {member.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Star size={12} color={colors.amber[400]} fill={colors.amber[400]} />
                      <Text style={styles.primaryText}>{t('family.primary')}</Text>
                    </View>
                  )}
                  {activeMember?.id === member.id && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeText}>{t('family.active')}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberRelationship}>{member.relationship}</Text>
                {member.bloodGroup && (
                  <Text style={styles.memberDetail}>{t('family.bloodGroup')}: {member.bloodGroup}</Text>
                )}
                {member.dateOfBirth && (
                  <Text style={styles.memberDetail}>{t('family.dateOfBirth')}: {member.dateOfBirth}</Text>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.memberActions}>
              {!member.isPrimary && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetPrimary(member)}
                >
                  <Star size={18} color={colors.gray[600]} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleOpenModal(member)}
              >
                <Edit2 size={18} color={colors.primary[600]} />
              </TouchableOpacity>
              {familyMembers.length > 1 && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(member)}
                >
                  <Trash2 size={18} color={colors.red[600]} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenModal()}
        >
          <Plus size={24} color={colors.primary[600]} />
          <Text style={styles.addButtonText}>{t('family.addMember')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingMember ? t('family.editMember') : t('family.addMember')}
            </Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <X size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('family.name')} *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('family.name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('family.relationship')} *</Text>
              <TextInput
                style={styles.input}
                value={relationship}
                onChangeText={setRelationship}
                placeholder={t('family.relationship')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('family.dateOfBirth')}</Text>
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('family.gender')}</Text>
              <View style={styles.genderButtons}>
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      gender === g && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === g && styles.genderButtonTextActive,
                      ]}
                    >
                      {t(`family.${g.toLowerCase()}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('family.bloodGroup')}</Text>
              <TextInput
                style={styles.input}
                value={bloodGroup}
                onChangeText={setBloodGroup}
                placeholder="A+, B-, O+"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('family.emergencyContact')}</Text>
              <TextInput
                style={styles.input}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder={t('family.emergencyContact')}
                keyboardType="phone-pad"
                placeholderTextColor={colors.gray[400]}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCloseModal}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['4'],
  },
  section: {
    marginTop: spacing['4'],
    marginBottom: spacing['6'],
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing['2'],
  },
  sectionDescription: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing['4'],
    marginBottom: spacing['3'],
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  activeMemberCard: {
    borderWidth: 2,
    borderColor: colors.primary[600],
  },
  memberContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  avatarText: {
    ...textStyles.h3,
    color: colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing['1'],
  },
  memberName: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginRight: spacing['2'],
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amber[50],
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    borderRadius: 12,
    marginRight: spacing['2'],
  },
  primaryText: {
    ...textStyles.caption,
    color: colors.amber[800],
    marginLeft: 4,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    borderRadius: 12,
  },
  activeText: {
    ...textStyles.caption,
    color: colors.primary[700],
    fontWeight: '600',
  },
  memberRelationship: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing['1'],
  },
  memberDetail: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  memberActions: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  actionButton: {
    padding: spacing['2'],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing['4'],
    marginTop: spacing['2'],
    marginBottom: spacing['6'],
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
  },
  addButtonText: {
    ...textStyles.body,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: spacing['2'],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing['4'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing['4'],
  },
  formGroup: {
    marginBottom: spacing['4'],
  },
  label: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing['2'],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: spacing['3'],
    ...textStyles.body,
    color: colors.text.primary,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  genderButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: spacing['3'],
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  genderButtonText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  genderButtonTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing['4'],
    gap: spacing['3'],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  modalButton: {
    flex: 1,
    padding: spacing['4'],
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
  },
  cancelButtonText: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary[600],
  },
  saveButtonText: {
    ...textStyles.body,
    color: colors.white,
    fontWeight: '600',
  },
});

export default FamilyMembersScreen;
