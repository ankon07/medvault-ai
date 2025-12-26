/**
 * Profile View Store
 * Manages which family member's profile is currently being viewed
 */

import { create } from "zustand";
import { shallow } from "zustand/shallow";
import AsyncStorage from "@react-native-async-storage/async-storage";

const VIEWING_PROFILE_KEY = "@medivault_viewing_profile";

interface ViewingProfile {
  userId: string;
  userName: string;
  userEmail: string;
}

interface ProfileViewState {
  // State
  viewingUserId: string | null;
  viewingUserName: string | null;
  viewingUserEmail: string | null;

  // Actions
  setViewingProfile: (
    userId: string,
    name: string,
    email: string
  ) => Promise<void>;
  clearViewingProfile: () => Promise<void>;
  isViewingOtherProfile: () => boolean;
  getViewingUserId: (currentUserId: string) => string;
  initializeViewingProfile: () => Promise<void>;
}

export const useProfileViewStore = create<ProfileViewState>((set, get) => ({
  // Initial state
  viewingUserId: null,
  viewingUserName: null,
  viewingUserEmail: null,

  /**
   * Set the profile being viewed (switch to family member's profile)
   */
  setViewingProfile: async (userId: string, name: string, email: string) => {
    set({
      viewingUserId: userId,
      viewingUserName: name,
      viewingUserEmail: email,
    });

    // Persist to AsyncStorage
    try {
      const profile: ViewingProfile = {
        userId,
        userName: name,
        userEmail: email,
      };
      await AsyncStorage.setItem(VIEWING_PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error("Failed to persist viewing profile:", error);
    }
  },

  /**
   * Clear viewing profile (switch back to own profile)
   */
  clearViewingProfile: async () => {
    set({
      viewingUserId: null,
      viewingUserName: null,
      viewingUserEmail: null,
    });

    // Clear from AsyncStorage
    try {
      await AsyncStorage.removeItem(VIEWING_PROFILE_KEY);
    } catch (error) {
      console.error("Failed to clear viewing profile:", error);
    }
  },

  /**
   * Check if currently viewing another user's profile
   */
  isViewingOtherProfile: () => {
    return get().viewingUserId !== null;
  },

  /**
   * Get the user ID whose data should be loaded
   * Returns viewingUserId if set, otherwise returns currentUserId
   */
  getViewingUserId: (currentUserId: string) => {
    const { viewingUserId } = get();
    return viewingUserId || currentUserId;
  },

  /**
   * Initialize viewing profile from storage (on app start)
   */
  initializeViewingProfile: async () => {
    try {
      const stored = await AsyncStorage.getItem(VIEWING_PROFILE_KEY);
      if (stored) {
        const profile: ViewingProfile = JSON.parse(stored);
        set({
          viewingUserId: profile.userId,
          viewingUserName: profile.userName,
          viewingUserEmail: profile.userEmail,
        });
      }
    } catch (error) {
      console.error("Failed to initialize viewing profile:", error);
    }
  },
}));

// Selector hooks for easier usage
// Using individual state selections to avoid creating new objects on every render
export const useViewingProfile = () => {
  const userId = useProfileViewStore((state) => state.viewingUserId);
  const userName = useProfileViewStore((state) => state.viewingUserName);
  const userEmail = useProfileViewStore((state) => state.viewingUserEmail);
  const isViewing = userId !== null;

  return { userId, userName, userEmail, isViewing };
};

export const useProfileViewActions = () => {
  const {
    setViewingProfile,
    clearViewingProfile,
    isViewingOtherProfile,
    getViewingUserId,
    initializeViewingProfile,
  } = useProfileViewStore();

  return {
    setViewingProfile,
    clearViewingProfile,
    isViewingOtherProfile,
    getViewingUserId,
    initializeViewingProfile,
  };
};
