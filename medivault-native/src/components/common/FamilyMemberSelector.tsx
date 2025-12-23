/**
 * Family Member Selector Component
 * Compact selector to show and switch active family member
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { ChevronDown, Check, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, shadows, textStyles } from '../../theme';
import {
  useFamilyMembers,
  useActiveMember,
  useFamilyActions,
  getAvatarColor,
} from '../../store/useFamilyStore';

interface FamilyMemberSelectorProps {
  /** Show full name or just initials */
  compact?: boolean;
  /** Custom style for the container */
  style?: any;
  /** Show manage members button */
  showManageButton?: boolean;
  /** Callback when manage button is pressed */
  onManagePress?: () => void;
}

export const FamilyMemberSelector: React.FC<FamilyMemberSelectorProps> = ({
  compact = false,
  style,
  showManageButton = false,
  onManagePress,
}) => {
  const { t } = useTranslation();
  const familyMembers = useFamilyMembers();
  const activeMember = useActiveMember();
  const { setActiveMember } = useFamilyActions();
  const [modalVisible, setModalVisible] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSelectMember = async (member: any) => {
    await setActiveMember(member);
    setModalVisible(false);
  };

  if (!activeMember || familyMembers.length === 0) {
    return null;
  }

  const activeMemberIndex = familyMembers.findIndex((m) => m.id === activeMember.id);

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: getAvatarColor(activeMemberIndex) },
          ]}
        >
          <Text style={styles.avatarText}>{getInitials(activeMember.name)}</Text>
        </View>
        
        {!compact && (
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {activeMember.name}
            </Text>
            <Text style={styles.relationship} numberOfLines={1}>
              {activeMember.relationship}
            </Text>
          </View>
        )}
        
        <ChevronDown size={18} color={colors.gray[600]} />
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Users size={20} color={colors.primary[600]} />
              <Text style={styles.modalTitle}>{t('family.title')}</Text>
            </View>

            <ScrollView
              style={styles.membersList}
              showsVerticalScrollIndicator={false}
            >
              {familyMembers.map((member, index) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberItem,
                    activeMember.id === member.id && styles.memberItemActive,
                  ]}
                  onPress={() => handleSelectMember(member)}
                >
                  <View
                    style={[
                      styles.memberAvatar,
                      { backgroundColor: getAvatarColor(index) },
                    ]}
                  >
                    <Text style={styles.memberAvatarText}>
                      {getInitials(member.name)}
                    </Text>
                  </View>

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRelationship}>
                      {member.relationship}
                    </Text>
                  </View>

                  {activeMember.id === member.id && (
                    <Check size={20} color={colors.primary[600]} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {showManageButton && onManagePress && (
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => {
                  setModalVisible(false);
                  onManagePress();
                }}
              >
                <Text style={styles.manageButtonText}>{t('family.manageProfiles')}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing['2'],
    paddingRight: spacing['3'],
    ...shadows.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['2'],
  },
  avatarText: {
    ...textStyles.label,
    color: colors.white,
    fontSize: 14,
  },
  info: {
    flex: 1,
    marginRight: spacing['2'],
  },
  name: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  relationship: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontSize: 11,
    textTransform: 'none',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['4'],
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing['4'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing['2'],
  },
  modalTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  membersList: {
    maxHeight: 400,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  memberItemActive: {
    backgroundColor: colors.primary[50],
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  memberAvatarText: {
    ...textStyles.body,
    color: colors.white,
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRelationship: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontSize: 12,
    textTransform: 'none',
  },
  manageButton: {
    padding: spacing['4'],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center',
  },
  manageButtonText: {
    ...textStyles.body,
    color: colors.primary[600],
    fontWeight: '600',
  },
});

export default FamilyMemberSelector;
