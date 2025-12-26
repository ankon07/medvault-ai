/**
 * Authentication Store
 * Manages user authentication state using Zustand
 */

import { create } from "zustand";
import {
  AuthUser,
  SignUpData,
  SignInData,
  signUp as firebaseSignUp,
  signIn as firebaseSignIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
  subscribeToAuthChanges,
  getCurrentUser,
  updateUserProfile as firebaseUpdateProfile,
} from "../services/firebaseAuthService";
import {
  saveUserProfile,
  getUserProfile,
  UserProfile,
} from "../services/firebaseDatabaseService";
import {
  isBiometricAvailable,
  isBiometricEnabled,
  canUseBiometricLogin,
  authenticateWithBiometrics,
  setupBiometricLogin,
  disableBiometricLogin,
  getBiometricTypeName,
  clearStoredCredentials,
} from "../services/biometricService";

interface AuthState {
  // State
  user: AuthUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  isSigningOut: boolean;
  error: string | null;

  // Biometric state
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricType: string;

  // Actions
  initialize: () => () => void;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  clearError: () => void;

  // Biometric actions
  checkBiometricStatus: () => Promise<void>;
  signInWithBiometrics: () => Promise<boolean>;
  enableBiometricLogin: (email: string, password: string) => Promise<void>;
  disableBiometric: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  userProfile: null,
  isLoading: true,
  isInitialized: false,
  isSigningOut: false,
  error: null,

  // Biometric initial state
  biometricAvailable: false,
  biometricEnabled: false,
  biometricType: "Biometric",

  /**
   * Initialize auth state listener
   * Returns unsubscribe function
   */
  initialize: () => {
    set({ isLoading: true });

    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (user) {
        // User is signed in, fetch their profile
        try {
          const profile = await getUserProfile(user.uid);
          set({
            user,
            userProfile: profile,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        } catch (error) {
          set({
            user,
            userProfile: null,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        }
      } else {
        // User is signed out
        set({
          user: null,
          userProfile: null,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
      }
    });

    return unsubscribe;
  },

  /**
   * Sign up a new user
   */
  signUp: async (data: SignUpData) => {
    set({ isLoading: true, error: null });

    try {
      const user = await firebaseSignUp(data);

      // Create user profile in database
      // Note: Firebase Realtime Database doesn't accept undefined values,
      // so we only include photoURL if it exists
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || data.email,
        displayName: data.displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Only add photoURL if it exists (Firebase doesn't accept undefined)
      if (user.photoURL) {
        profile.photoURL = user.photoURL;
      }

      await saveUserProfile(profile);

      set({
        user,
        userProfile: profile,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to sign up",
      });
      throw error;
    }
  },

  /**
   * Sign in an existing user
   */
  signIn: async (data: SignInData) => {
    set({ isLoading: true, error: null });

    try {
      const user = await firebaseSignIn(data);

      // Fetch user profile from database
      const profile = await getUserProfile(user.uid);

      set({
        user,
        userProfile: profile,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to sign in",
      });
      throw error;
    }
  },

  /**
   * Sign in with Google
   */
  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      const user = await firebaseSignInWithGoogle();

      // Check if profile exists, if not create one
      let profile = await getUserProfile(user.uid);

      if (!profile) {
        // Create new profile for Google sign-in user
        // Note: Firebase Realtime Database doesn't accept undefined values,
        // so we only include optional fields if they exist
        profile = {
          uid: user.uid,
          email: user.email || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Only add optional fields if they exist (Firebase doesn't accept undefined)
        if (user.displayName) {
          profile.displayName = user.displayName;
        }
        if (user.photoURL) {
          profile.photoURL = user.photoURL;
        }

        await saveUserProfile(profile);
      }

      set({
        user,
        userProfile: profile,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to sign in with Google",
      });
      throw error;
    }
  },

  /**
   * Sign out the current user
   * Cleanup stores BEFORE signing out to prevent permission errors
   */
  signOut: async () => {
    set({ isSigningOut: true, error: null });

    try {
      // IMPORTANT: Cleanup stores BEFORE Firebase sign out
      // This prevents permission errors during navigation transition
      const { useRecordStore } = require("./useRecordStore");
      const { useNotificationStore } = require("./useNotificationStore");
      const { useFamilyStore } = require("./useFamilyStore");

      // Clean up all store subscriptions first
      useRecordStore.getState().cleanup();
      useNotificationStore.getState().reset();
      useFamilyStore.getState().reset();

      // Small delay to ensure cleanup completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now sign out from Firebase
      await firebaseSignOut();

      set({
        user: null,
        userProfile: null,
        isSigningOut: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isSigningOut: false,
        isLoading: false,
        error: error.message || "Failed to sign out",
      });
      throw error;
    }
  },

  /**
   * Send password reset email
   */
  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });

    try {
      await firebaseResetPassword(email);
      set({ isLoading: false, error: null });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to send reset email",
      });
      throw error;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (displayName?: string, photoURL?: string) => {
    const { user, userProfile } = get();

    if (!user) {
      throw new Error("No authenticated user");
    }

    set({ isLoading: true, error: null });

    try {
      // Update Firebase Auth profile
      await firebaseUpdateProfile(displayName, photoURL);

      // Update profile in database
      if (userProfile) {
        const updatedProfile: UserProfile = {
          ...userProfile,
          displayName: displayName ?? userProfile.displayName,
          photoURL: photoURL ?? userProfile.photoURL,
          updatedAt: new Date().toISOString(),
        };

        await saveUserProfile(updatedProfile);

        set({
          user: {
            ...user,
            displayName: displayName ?? user.displayName,
            photoURL: photoURL ?? user.photoURL,
          },
          userProfile: updatedProfile,
          isLoading: false,
          error: null,
        });
      } else {
        set({ isLoading: false, error: null });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to update profile",
      });
      throw error;
    }
  },

  /**
   * Clear any error messages
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Check and update biometric authentication status
   */
  checkBiometricStatus: async () => {
    try {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      const typeName = await getBiometricTypeName();

      set({
        biometricAvailable: available,
        biometricEnabled: enabled,
        biometricType: typeName,
      });
    } catch (error) {
      console.error("Error checking biometric status:", error);
      set({
        biometricAvailable: false,
        biometricEnabled: false,
      });
    }
  },

  /**
   * Sign in using biometric authentication
   * Returns true if successful, false otherwise
   */
  signInWithBiometrics: async () => {
    set({ isLoading: true, error: null });

    try {
      const result = await authenticateWithBiometrics();

      if (result.success && result.credentials) {
        // Use the stored credentials to sign in
        const user = await firebaseSignIn({
          email: result.credentials.email,
          password: result.credentials.password,
        });

        // Fetch user profile
        const profile = await getUserProfile(user.uid);

        set({
          user,
          userProfile: profile,
          isLoading: false,
          error: null,
        });

        return true;
      } else {
        set({
          isLoading: false,
          error: result.error || "Biometric authentication failed",
        });
        return false;
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to sign in with biometrics",
      });
      return false;
    }
  },

  /**
   * Enable biometric login by storing credentials
   */
  enableBiometricLogin: async (email: string, password: string) => {
    try {
      await setupBiometricLogin(email, password);

      // Update state
      set({
        biometricEnabled: true,
      });
    } catch (error: any) {
      console.error("Error enabling biometric login:", error);
      throw new Error(error.message || "Failed to enable biometric login");
    }
  },

  /**
   * Disable biometric login and clear stored credentials
   */
  disableBiometric: async () => {
    try {
      await disableBiometricLogin();

      // Update state
      set({
        biometricEnabled: false,
      });
    } catch (error: any) {
      console.error("Error disabling biometric login:", error);
      throw new Error(error.message || "Failed to disable biometric login");
    }
  },
}));

// Selector hooks for common use cases
export const useAuth = () => {
  const { user, userProfile, isLoading, isInitialized, error } = useAuthStore();
  return { user, userProfile, isLoading, isInitialized, error };
};

export const useAuthActions = () => {
  const {
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    clearError,
  } = useAuthStore();
  return {
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    clearError,
  };
};

export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.user !== null);
};

// Biometric hooks
export const useBiometric = () => {
  const { biometricAvailable, biometricEnabled, biometricType } =
    useAuthStore();
  return { biometricAvailable, biometricEnabled, biometricType };
};

export const useBiometricActions = () => {
  const {
    checkBiometricStatus,
    signInWithBiometrics,
    enableBiometricLogin,
    disableBiometric,
  } = useAuthStore();
  return {
    checkBiometricStatus,
    signInWithBiometrics,
    enableBiometricLogin,
    disableBiometric,
  };
};
