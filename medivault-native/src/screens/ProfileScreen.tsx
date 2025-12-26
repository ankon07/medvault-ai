/**
 * MediVault AI - Profile Screen (Placeholder)
 * User profile management screen - to be implemented
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { User } from "lucide-react-native";
import { Header } from "../components/common";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../theme";

/**
 * Profile screen component (placeholder)
 */
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" onBack={handleBack} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Placeholder Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <User size={48} color={colors.primary[600]} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Profile Screen</Text>

        {/* Description */}
        <Text style={styles.description}>
          This is a placeholder for the user profile screen. Future features
          will include:
        </Text>

        {/* Feature List */}
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.bullet} />
            <Text style={styles.featureText}>Edit profile information</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.bullet} />
            <Text style={styles.featureText}>Update profile picture</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.bullet} />
            <Text style={styles.featureText}>View account statistics</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.bullet} />
            <Text style={styles.featureText}>Manage personal information</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.bullet} />
            <Text style={styles.featureText}>Privacy settings</Text>
          </View>
        </View>

        {/* Coming Soon Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
      </ScrollView>
    </View>
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
  contentContainer: {
    padding: spacing["6"],
    alignItems: "center",
  },
  iconContainer: {
    marginTop: spacing["12"],
    marginBottom: spacing["6"],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.primary[100],
  },
  title: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing["3"],
    textAlign: "center",
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing["6"],
    paddingHorizontal: spacing["4"],
  },
  featureList: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: borderRadius["3xl"],
    padding: spacing["6"],
    gap: spacing["4"],
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["3"],
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  featureText: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  badge: {
    marginTop: spacing["8"],
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing["6"],
    paddingVertical: spacing["3"],
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

export default ProfileScreen;
