/**
 * Authentication Store
 * Manages user authentication state using Zustand
 */

import { create } from 'zustand';
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
} from '../services/firebaseAuthService';
import { saveUserProfile, getUserProfile, UserProfile } from '../services/firebaseDatabaseService';

interface AuthState {
  // State
  user: AuthUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  initialize: () => () => void;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  userProfile: null,
  isLoading: true,
  isInitialized: false,
  error: null,

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
            error: null 
          });
        } catch (error) {
          set({ 
            user, 
            userProfile: null,
            isLoading: false, 
            isInitialized: true,
            error: null 
          });
        }
      } else {
        // User is signed out
        set({ 
          user: null, 
          userProfile: null,
          isLoading: false, 
          isInitialized: true,
          error: null 
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
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || data.email,
        displayName: data.displayName,
        photoURL: user.photoURL ?? undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await saveUserProfile(profile);
      
      set({ 
        user, 
        userProfile: profile,
        isLoading: false, 
        error: null 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to sign up' 
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
        error: null 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to sign in' 
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
        profile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      }
      
      set({ 
        user, 
        userProfile: profile,
        isLoading: false, 
        error: null 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to sign in with Google' 
      });
      throw error;
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await firebaseSignOut();
      set({ 
        user: null, 
        userProfile: null,
        isLoading: false, 
        error: null 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to sign out' 
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
        error: error.message || 'Failed to send reset email' 
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
      throw new Error('No authenticated user');
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
          error: null 
        });
      } else {
        set({ isLoading: false, error: null });
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to update profile' 
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
}));

// Selector hooks for common use cases
export const useAuth = () => {
  const { user, userProfile, isLoading, isInitialized, error } = useAuthStore();
  return { user, userProfile, isLoading, isInitialized, error };
};

export const useAuthActions = () => {
  const { signUp, signIn, signInWithGoogle, signOut, resetPassword, updateProfile, clearError } = useAuthStore();
  return { signUp, signIn, signInWithGoogle, signOut, resetPassword, updateProfile, clearError };
};

export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.user !== null);
};
