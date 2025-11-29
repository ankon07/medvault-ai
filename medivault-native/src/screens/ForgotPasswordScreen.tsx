/**
 * MediVault AI - Forgot Password Screen
 * Password reset functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Mail,
  ChevronLeft,
  Send,
  Heart,
  CheckCircle2,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { LoadingOverlay } from '../components/common';
import { useAuthStore } from '../store/useAuthStore';
import { AuthStackScreenProps } from '../navigation/types';

type Props = AuthStackScreenProps<'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { resetPassword, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      await resetPassword(email.trim());
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (emailSent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing['8'] }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={48} color={colors.green[500]} />
          </View>
          <Text style={styles.successTitle}>Email Sent!</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
          <Text style={styles.successHint}>
            Check your inbox and follow the instructions to reset your password.
          </Text>
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={handleGoBack}
            activeOpacity={0.9}
          >
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LoadingOverlay visible={isLoading} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing['4'], paddingBottom: insets.bottom + spacing['8'] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Heart size={28} color={colors.primary[600]} />
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Forgot Password?</Text>
          <Text style={styles.formSubtitle}>
            No worries! Enter your email address and we'll send you a link to reset your password.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Mail size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.gray[400]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPassword}
            activeOpacity={0.9}
          >
            <Send size={20} color={colors.white} />
            <Text style={styles.resetButtonText}>Send Reset Link</Text>
          </TouchableOpacity>
        </View>

        {/* Back to Sign In */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Remember your password? </Text>
          <TouchableOpacity onPress={handleGoBack}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flexGrow: 1,
    padding: spacing['6'],
  },
  header: {
    marginBottom: spacing['8'],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['8'],
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['4xl'],
    padding: spacing['8'],
    ...shadows.lg,
    marginBottom: spacing['8'],
  },
  formTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['2'],
  },
  formSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing['6'],
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    marginBottom: spacing['6'],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  input: {
    flex: 1,
    marginLeft: spacing['3'],
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing['4'],
    gap: spacing['2'],
    ...shadows.md,
  },
  resetButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  signInLink: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  // Success State
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['6'],
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.green[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['6'],
  },
  successTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['3'],
  },
  successMessage: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing['2'],
  },
  emailText: {
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  successHint: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing['8'],
  },
  backToLoginButton: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['8'],
    ...shadows.md,
  },
  backToLoginText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});

export default ForgotPasswordScreen;
