/**
 * Family Members Management Screen
 * Email-based family invitation system
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Send, Check, X, Users, LogOut } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing, shadows, textStyles } from "../theme";
import { Header, LoadingOverlay } from "../components/common";
import { useAuth } from "../store/useAuthStore";
import { useRecordStore } from "../store/useRecordStore";
import {
  useProfileViewActions,
  useViewingProfile,
} from "../store/useProfileViewStore";
import {
  sendFamilyRequest,
  getPendingRequestsForUser,
  getSentRequests,
  acceptFamilyRequest,
  declineFamilyRequest,
  getUserFamily,
  leaveFamily,
  cancelSentRequest,
} from "../services/familyRequestService";
import { FamilyRequest, Family } from "../types";

export const FamilyMembersScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, userProfile } = useAuth();
  const { setViewingProfile } = useProfileViewActions();
  const { switchToProfile } = useRecordStore();
  const viewingProfile = useViewingProfile();

  const [inviteEmail, setInviteEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState<FamilyRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FamilyRequest[]>([]);
  const [family, setFamily] = useState<Family | null>(null);

  // Determine which profile is currently active
  const activeProfileId = viewingProfile.userId || user?.uid;

  useEffect(() => {
    loadData();
  }, [user?.uid, user?.email]);

  const loadData = async () => {
    if (!user?.uid || !user?.email) return;

    setIsInitialLoading(true);
    try {
      // Try to load, but don't fail if empty
      const sent = await getSentRequests(user.uid).catch(() => []);
      setSentRequests(sent);

      const incoming = await getPendingRequestsForUser(user.email).catch(
        () => []
      );
      setIncomingRequests(incoming);

      const userFamily = await getUserFamily(user.uid).catch(() => null);
      setFamily(userFamily);
    } catch (error) {
      console.error("Error loading family data:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert(t("common.error"), "Please enter an email address");
      return;
    }

    if (!user?.uid || !user?.email) return;

    setIsLoading(true);
    try {
      const result = await sendFamilyRequest(
        user.uid,
        userProfile?.displayName || user.displayName || "User",
        user.email,
        inviteEmail.trim()
      );

      if (result.success) {
        Alert.alert(t("common.success"), "Family invitation sent!");
        setInviteEmail("");
        loadData();
      } else {
        Alert.alert(
          t("common.error"),
          result.error || "Failed to send invitation"
        );
      }
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || "Failed to send invitation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const result = await acceptFamilyRequest(requestId, user.uid);

      if (result.success) {
        Alert.alert(t("common.success"), "You joined the family!");
        loadData();
      } else {
        Alert.alert(
          t("common.error"),
          result.error || "Failed to accept invitation"
        );
      }
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || "Failed to accept invitation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const result = await declineFamilyRequest(requestId);

      if (result.success) {
        Alert.alert(t("common.success"), "Invitation declined");
        loadData();
      } else {
        Alert.alert(
          t("common.error"),
          result.error || "Failed to decline invitation"
        );
      }
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || "Failed to decline invitation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveFamily = () => {
    if (!user?.uid || !family) return;

    Alert.alert("Leave Family", "Are you sure you want to leave this family?", [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            const result = await leaveFamily(user.uid, family.id);
            if (result.success) {
              Alert.alert(t("common.success"), "You left the family");
              loadData();
            } else {
              Alert.alert(
                t("common.error"),
                result.error || "Failed to leave family"
              );
            }
          } catch (error: any) {
            Alert.alert(t("common.error"), error.message);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleMemberClick = async (
    memberId: string,
    memberName: string,
    memberEmail: string
  ) => {
    if (!user?.uid) return;

    // If clicking on self, do nothing
    if (memberId === user.uid) {
      return;
    }

    // Show confirmation dialog
    Alert.alert("Switch Profile", `View ${memberName}'s medical records?`, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: "Switch",
        onPress: async () => {
          try {
            setIsLoading(true);
            await setViewingProfile(memberId, memberName, memberEmail);
            await switchToProfile(memberId);
            Alert.alert(
              t("common.success"),
              `Now viewing ${memberName}'s profile`
            );
          } catch (error: any) {
            Alert.alert(
              t("common.error"),
              error.message || "Failed to switch profile"
            );
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleCancelRequest = async (requestId: string, toEmail: string) => {
    if (!user?.uid) return;

    Alert.alert("Cancel Invitation", `Cancel invitation to ${toEmail}?`, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: "Cancel Invitation",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            const result = await cancelSentRequest(requestId, user.uid);
            if (result.success) {
              Alert.alert(t("common.success"), "Invitation cancelled");
              loadData();
            } else {
              Alert.alert(
                t("common.error"),
                result.error || "Failed to cancel invitation"
              );
            }
          } catch (error: any) {
            Alert.alert(t("common.error"), error.message);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          text: "Pending",
          color: colors.amber[400],
          bg: colors.amber[50],
        };
      case "accepted":
        return {
          text: "Accepted",
          color: colors.green[600],
          bg: colors.green[100],
        };
      case "declined":
        return { text: "Declined", color: colors.red[600], bg: colors.red[50] };
      default:
        return { text: status, color: colors.gray[600], bg: colors.gray[50] };
    }
  };

  const isOwner = family?.ownerId === user?.uid;
  const memberCount = family ? Object.keys(family.members).length : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title={t("family.title")} />

      <LoadingOverlay
        visible={isInitialLoading}
        message="Loading Family Members..."
        submessage="Fetching invitations and family members"
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Invite Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Invite Family Member</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Send an invitation to join your family by email
          </Text>

          <View style={styles.inviteBox}>
            <TextInput
              style={styles.emailInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="Enter email address"
              placeholderTextColor={colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                isLoading && styles.sendButtonDisabled,
              ]}
              onPress={handleSendInvite}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Send size={18} color={colors.white} />
                  <Text style={styles.sendButtonText}>Send</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Incoming Requests */}
        {incomingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Mail size={20} color={colors.blue[600]} />
              <Text style={styles.sectionTitle}>
                Incoming Requests ({incomingRequests.length})
              </Text>
            </View>
            {incomingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTitle}>
                    {request.fromUserName || "Someone"} invited you
                  </Text>
                  <Text style={styles.requestEmail}>
                    {request.fromUserEmail}
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(request.id)}
                    disabled={isLoading}
                  >
                    <Check size={18} color={colors.white} />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDeclineRequest(request.id)}
                    disabled={isLoading}
                  >
                    <X size={18} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sent Requests */}
        {sentRequests.filter((r) => r.status === "pending").length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Send size={20} color={colors.gray[600]} />
              <Text style={styles.sectionTitle}>
                Sent Invitations (
                {sentRequests.filter((r) => r.status === "pending").length})
              </Text>
            </View>
            {sentRequests
              .filter((r) => r.status === "pending")
              .map((request) => {
                const badge = getStatusBadge(request.status);
                return (
                  <View key={request.id} style={styles.sentCard}>
                    <View style={styles.sentInfo}>
                      <Text style={styles.sentEmail}>{request.toEmail}</Text>
                      <View style={styles.sentActions}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: badge.bg },
                          ]}
                        >
                          <Text
                            style={[styles.statusText, { color: badge.color }]}
                          >
                            {badge.text}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() =>
                            handleCancelRequest(request.id, request.toEmail)
                          }
                          disabled={isLoading}
                        >
                          <X size={16} color={colors.red[600]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* Family Members */}
        {family && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color={colors.green[600]} />
              <Text style={styles.sectionTitle}>
                Family Members ({memberCount})
              </Text>
            </View>

            {Object.entries(family.members)
              .sort((a, b) => {
                const nameA = (a[1].displayName || a[1].email).toLowerCase();
                const nameB = (b[1].displayName || b[1].email).toLowerCase();
                return nameA.localeCompare(nameB);
              })
              .map(([memberId, memberData]) => {
                const isCurrentUser = memberId === user?.uid;
                const isOwnerMember = memberId === family.ownerId;
                const isActiveProfile = memberId === activeProfileId;

                return (
                  <TouchableOpacity
                    key={memberId}
                    style={[
                      styles.memberCard,
                      isActiveProfile && styles.memberCardActive,
                    ]}
                    onPress={() =>
                      handleMemberClick(
                        memberId,
                        memberData.displayName || memberData.email,
                        memberData.email
                      )
                    }
                    disabled={isCurrentUser || isLoading}
                    activeOpacity={isCurrentUser ? 1 : 0.7}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {memberData.displayName?.charAt(0)?.toUpperCase() ||
                          memberData.email.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>
                          {memberData.displayName || memberData.email}
                        </Text>
                        {isCurrentUser && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>You</Text>
                          </View>
                        )}
                        {isOwnerMember && (
                          <View style={styles.ownerBadge}>
                            <Text style={styles.ownerBadgeText}>Owner</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberEmail}>{memberData.email}</Text>
                      <Text style={styles.memberRole}>{memberData.role}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

            {/* Leave Family Button (only for non-owners) */}
            {!isOwner && (
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={handleLeaveFamily}
                disabled={isLoading}
              >
                <LogOut size={18} color={colors.red[600]} />
                <Text style={styles.leaveButtonText}>Leave Family</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Empty State */}
        {!family &&
          incomingRequests.length === 0 &&
          sentRequests.length === 0 && (
            <View style={styles.emptyState}>
              <Users size={64} color={colors.gray[300]} />
              <Text style={styles.emptyStateTitle}>No Family Yet</Text>
              <Text style={styles.emptyStateText}>
                Invite family members by email to get started
              </Text>
            </View>
          )}
      </ScrollView>
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
  },
  scrollContent: {
    padding: spacing["4"],
  },
  section: {
    marginBottom: spacing["6"],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing["2"],
    gap: spacing["2"],
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  sectionDescription: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing["4"],
  },
  inviteBox: {
    flexDirection: "row",
    gap: spacing["2"],
  },
  emailInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: spacing["3"],
    ...textStyles.body,
    color: colors.text.primary,
  },
  sendButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    paddingHorizontal: spacing["4"],
    paddingVertical: spacing["3"],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing["2"],
    minWidth: 100,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    ...textStyles.body,
    color: colors.white,
    fontWeight: "600",
  },
  requestCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing["4"],
    marginBottom: spacing["3"],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.sm,
    borderWidth: 2,
    borderColor: colors.blue[100],
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    ...textStyles.body,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing["1"],
  },
  requestEmail: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  requestActions: {
    flexDirection: "row",
    gap: spacing["2"],
  },
  acceptButton: {
    backgroundColor: colors.green[600],
    borderRadius: 8,
    paddingHorizontal: spacing["3"],
    paddingVertical: spacing["2"],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["1"],
  },
  acceptButtonText: {
    ...textStyles.caption,
    color: colors.white,
    fontWeight: "600",
  },
  declineButton: {
    backgroundColor: colors.red[50],
    borderRadius: 8,
    paddingHorizontal: spacing["2"],
    paddingVertical: spacing["2"],
    alignItems: "center",
    justifyContent: "center",
  },
  sentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing["4"],
    marginBottom: spacing["3"],
    ...shadows.sm,
  },
  sentInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sentEmail: {
    ...textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  sentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["2"],
  },
  statusBadge: {
    paddingHorizontal: spacing["2"],
    paddingVertical: spacing["1"],
    borderRadius: 12,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: colors.red[50],
    borderRadius: 8,
    padding: spacing["2"],
    alignItems: "center",
    justifyContent: "center",
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing["4"],
    marginBottom: spacing["3"],
    flexDirection: "row",
    alignItems: "center",
    ...shadows.sm,
  },
  memberCardActive: {
    borderWidth: 3,
    borderColor: colors.primary[500],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing["3"],
  },
  memberAvatarText: {
    ...textStyles.h4,
    color: colors.white,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["2"],
    marginBottom: spacing["1"],
    flexWrap: "wrap",
  },
  memberName: {
    ...textStyles.body,
    fontWeight: "600",
    color: colors.text.primary,
  },
  memberEmail: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginBottom: spacing["1"],
  },
  memberRole: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textTransform: "capitalize",
  },
  youBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing["2"],
    paddingVertical: spacing["1"],
    borderRadius: 8,
  },
  youBadgeText: {
    ...textStyles.caption,
    color: colors.primary[700],
    fontWeight: "600",
  },
  ownerBadge: {
    backgroundColor: colors.amber[50],
    paddingHorizontal: spacing["2"],
    paddingVertical: spacing["1"],
    borderRadius: 8,
  },
  ownerBadgeText: {
    ...textStyles.caption,
    color: colors.amber[800],
    fontWeight: "600",
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing["2"],
    backgroundColor: colors.red[50],
    borderRadius: 12,
    padding: spacing["4"],
    marginTop: spacing["2"],
    borderWidth: 1,
    borderColor: colors.red[100],
  },
  leaveButtonText: {
    ...textStyles.body,
    color: colors.red[600],
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["24"],
  },
  emptyStateTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginTop: spacing["4"],
    marginBottom: spacing["2"],
  },
  emptyStateText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: "center",
  },
});

export default FamilyMembersScreen;
