/**
 * Profile Banner Component
 * Displays when viewing another family member's profile
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Users, ArrowLeft } from "lucide-react-native";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "../../theme";

interface ProfileBannerProps {
  memberName: string;
  onSwitchBack: () => void;
}

export const ProfileBanner: React.FC<ProfileBannerProps> = ({
  memberName,
  onSwitchBack,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Users size={20} color={colors.primary[600]} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Viewing Profile</Text>
          <Text style={styles.memberName}>{memberName}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.switchButton}
        onPress={onSwitchBack}
        activeOpacity={0.7}
      >
        <ArrowLeft size={16} color={colors.primary[700]} />
        <Text style={styles.switchButtonText}>Switch Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius["2xl"],
    padding: spacing["4"],
    marginBottom: spacing["4"],
    borderWidth: 1,
    borderColor: colors.primary[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing["3"],
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: fontWeight.semiBold,
    marginBottom: 2,
  },
  memberName: {
    fontSize: fontSize.md,
    color: colors.primary[900],
    fontWeight: fontWeight.bold,
  },
  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["1"],
    backgroundColor: colors.white,
    paddingHorizontal: spacing["3"],
    paddingVertical: spacing["2"],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  switchButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary[700],
    fontWeight: fontWeight.semiBold,
  },
});
