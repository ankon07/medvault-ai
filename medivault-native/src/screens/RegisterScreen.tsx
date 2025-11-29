/**
 * MediVault AI - Register Screen
 * User registration with email/password and Google OAuth
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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  User,
  ChevronLeft,
  Heart,
  Sparkles,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { LoadingOverlay } from '../components/common';
import { useAuthStore } from '../store/useAuthStore';
import { AuthStackScreenProps } from '../navigation/types';

type Props = AuthStackScreenProps<'Register'>;

const RegisterScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signUp, signInWithGoogle, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await signUp({
        email: email.trim(),
        password,
        displayName: name.trim(),
      });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (!error.message.includes('cancelled')) {
        Alert.alert('Google Sign-In Failed', error.message);
      }
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

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
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Heart size={28} color={colors.primary[600]} />
            </View>
            <Sparkles size={16} color={colors.primary[400]} style={styles.sparkle} />
          </View>
        </View>

        {/* Registration Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Create Account</Text>
          <Text style={styles.formSubtitle}>Sign up to get started</Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <User size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.gray[400]}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Lock size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.gray[400]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={20} color={colors.gray[400]} />
              ) : (
                <Eye size={20} color={colors.gray[400]} />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Lock size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.gray[400]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? (
                <EyeOff size={20} color={colors.gray[400]} />
              ) : (
                <Eye size={20} color={colors.gray[400]} />
              )}
            </TouchableOpacity>
          </View>

          {/* Password Requirements */}
          <Text style={styles.passwordHint}>
            Password must be at least 6 characters
          </Text>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            activeOpacity={0.9}
          >
            <UserPlus size={20} color={colors.white} />
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
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
    marginBottom: spacing['4'],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  logoContainer: {
    position: 'relative',
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
  sparkle: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['4xl'],
    padding: spacing['6'],
    ...shadows.lg,
    marginBottom: spacing['6'],
  },
  formTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['1'],
  },
  formSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing['6'],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    marginBottom: spacing['3'],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  input: {
    flex: 1,
    marginLeft: spacing['3'],
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  passwordHint: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing['6'],
    marginLeft: spacing['1'],
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing['4'],
    gap: spacing['2'],
    ...shadows.md,
  },
  registerButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing['5'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: spacing['4'],
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing['4'],
    gap: spacing['3'],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
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
});

export default RegisterScreen;
