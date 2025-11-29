/**
 * MediVault AI - Login Screen
 * User authentication with email/password and Google OAuth
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
  LogIn,
  Heart,
  Sparkles,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { LoadingOverlay } from '../components/common';
import { useAuthStore } from '../store/useAuthStore';
import { AuthStackScreenProps } from '../navigation/types';

type Props = AuthStackScreenProps<'Login'>;

const LoginScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      await signIn({ email: email.trim(), password });
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
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

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const handleSignUp = () => {
    navigation.navigate('Register' as never);
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
          { paddingTop: insets.top + spacing['8'], paddingBottom: insets.bottom + spacing['8'] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Heart size={32} color={colors.primary[600]} />
            </View>
            <Sparkles size={20} color={colors.primary[400]} style={styles.sparkle} />
          </View>
          <Text style={styles.title}>MediVault AI</Text>
          <Text style={styles.subtitle}>Your Personal Medical Assistant</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to continue</Text>

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

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.9}
          >
            <LogIn size={20} color={colors.white} />
            <Text style={styles.loginButtonText}>Sign In</Text>
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

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>Sign Up</Text>
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
    alignItems: 'center',
    marginBottom: spacing['10'],
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing['4'],
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  sparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    marginBottom: spacing['2'],
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
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
    marginBottom: spacing['4'],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  input: {
    flex: 1,
    marginLeft: spacing['3'],
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing['6'],
  },
  forgotPasswordText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.primary[600],
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing['4'],
    gap: spacing['2'],
    ...shadows.md,
  },
  loginButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing['6'],
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  signUpLink: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
});

export default LoginScreen;
