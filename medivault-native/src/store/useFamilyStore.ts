/**
 * Family Members Store
 * Manages family member profiles and active member selection
 */

import { create } from 'zustand';
import { FamilyMember } from '../types';
import {
  createFamilyMember,
  getUserFamilyMembers,
  getFamilyMemberById,
  updateFamilyMember,
  deleteFamilyMember,
  subscribeToFamilyMembers,
  setPrimaryFamilyMember,
  getPrimaryFamilyMember,
} from '../services/firebaseDatabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_MEMBER_KEY = '@medivault_active_member';

interface FamilyState {
  // State
  familyMembers: FamilyMember[];
  activeMember: FamilyMember | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadFamilyMembers: (userId: string) => Promise<void>;
  addFamilyMember: (userId: string, member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMember: (userId: string, memberId: string, updates: Partial<FamilyMember>) => Promise<void>;
  removeMember: (userId: string, memberId: string) => Promise<void>;
  setActiveMember: (member: FamilyMember) => Promise<void>;
  setPrimary: (userId: string, memberId: string) => Promise<void>;
  initializeActiveMember: (userId: string) => Promise<void>;
  subscribe: (userId: string) => () => void;
  clearError: () => void;
  reset: () => void;
}

// Avatar colors for family members
const AVATAR_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];

let unsubscribeFunction: (() => void) | null = null;

export const useFamilyStore = create<FamilyState>((set, get) => ({
  // Initial state
  familyMembers: [],
  activeMember: null,
  isLoading: false,
  error: null,

  /**
   * Load all family members for a user
   */
  loadFamilyMembers: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const members = await getUserFamilyMembers(userId);
      set({ familyMembers: members, isLoading: false });
      
      // If no active member is set, set the primary or first member
      const { activeMember } = get();
      if (!activeMember && members.length > 0) {
        const primary = members.find(m => m.isPrimary) || members[0];
        await get().setActiveMember(primary);
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load family members' 
      });
      throw error;
    }
  },

  /**
   * Add a new family member
   */
  addFamilyMember: async (
    userId: string,
    member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    set({ isLoading: true, error: null });
    
    try {
      const memberId = await createFamilyMember(userId, member);
      
      // Reload family members
      await get().loadFamilyMembers(userId);
      
      set({ isLoading: false });
      return memberId;
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to add family member' 
      });
      throw error;
    }
  },

  /**
   * Update a family member
   */
  updateMember: async (
    userId: string,
    memberId: string,
    updates: Partial<FamilyMember>
  ) => {
    set({ isLoading: true, error: null });
    
    try {
      await updateFamilyMember(userId, memberId, updates);
      
      // Reload family members
      await get().loadFamilyMembers(userId);
      
      // Update active member if it was updated
      const { activeMember } = get();
      if (activeMember?.id === memberId) {
        const updatedMember = await getFamilyMemberById(userId, memberId);
        if (updatedMember) {
          await get().setActiveMember(updatedMember);
        }
      }
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to update family member' 
      });
      throw error;
    }
  },

  /**
   * Remove a family member
   */
  removeMember: async (userId: string, memberId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { activeMember, familyMembers } = get();
      
      // Don't allow deleting the last member
      if (familyMembers.length <= 1) {
        throw new Error('Cannot delete the last family member');
      }
      
      await deleteFamilyMember(userId, memberId);
      
      // If the deleted member was active, switch to another member
      if (activeMember?.id === memberId) {
        const remaining = familyMembers.filter(m => m.id !== memberId);
        if (remaining.length > 0) {
          await get().setActiveMember(remaining[0]);
        }
      }
      
      // Reload family members
      await get().loadFamilyMembers(userId);
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to remove family member' 
      });
      throw error;
    }
  },

  /**
   * Set the active family member
   */
  setActiveMember: async (member: FamilyMember) => {
    set({ activeMember: member });
    
    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem(ACTIVE_MEMBER_KEY, member.id);
    } catch (error) {
      console.error('Failed to persist active member:', error);
    }
  },

  /**
   * Set a family member as primary
   */
  setPrimary: async (userId: string, memberId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await setPrimaryFamilyMember(userId, memberId);
      
      // Reload family members
      await get().loadFamilyMembers(userId);
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to set primary member' 
      });
      throw error;
    }
  },

  /**
   * Initialize active member from storage or set to primary/first
   */
  initializeActiveMember: async (userId: string) => {
    try {
      // Load family members first
      await get().loadFamilyMembers(userId);
      
      const { familyMembers } = get();
      if (familyMembers.length === 0) {
        return;
      }
      
      // Try to restore from AsyncStorage
      const storedMemberId = await AsyncStorage.getItem(ACTIVE_MEMBER_KEY);
      if (storedMemberId) {
        const storedMember = familyMembers.find(m => m.id === storedMemberId);
        if (storedMember) {
          set({ activeMember: storedMember });
          return;
        }
      }
      
      // Fall back to primary or first member
      const primary = familyMembers.find(m => m.isPrimary) || familyMembers[0];
      await get().setActiveMember(primary);
    } catch (error) {
      console.error('Failed to initialize active member:', error);
    }
  },

  /**
   * Subscribe to real-time family member updates
   */
  subscribe: (userId: string) => {
    // Unsubscribe from previous subscription if exists
    if (unsubscribeFunction) {
      unsubscribeFunction();
    }
    
    unsubscribeFunction = subscribeToFamilyMembers(
      userId,
      (members) => {
        set({ familyMembers: members });
        
        // Update active member if it changed
        const { activeMember } = get();
        if (activeMember) {
          const updated = members.find(m => m.id === activeMember.id);
          if (updated) {
            set({ activeMember: updated });
          }
        }
      },
      (error) => {
        console.error('Family members subscription error:', error);
        set({ error: error.message });
      }
    );
    
    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction();
        unsubscribeFunction = null;
      }
    };
  },

  /**
   * Clear error messages
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset state (on sign out)
   */
  reset: () => {
    if (unsubscribeFunction) {
      unsubscribeFunction();
      unsubscribeFunction = null;
    }
    
    set({
      familyMembers: [],
      activeMember: null,
      isLoading: false,
      error: null,
    });
  },
}));

// Selector hooks
export const useFamilyMembers = () => {
  return useFamilyStore((state) => state.familyMembers);
};

export const useActiveMember = () => {
  return useFamilyStore((state) => state.activeMember);
};

export const useFamilyActions = () => {
  const {
    loadFamilyMembers,
    addFamilyMember,
    updateMember,
    removeMember,
    setActiveMember,
    setPrimary,
    initializeActiveMember,
    subscribe,
    clearError,
    reset,
  } = useFamilyStore();
  
  return {
    loadFamilyMembers,
    addFamilyMember,
    updateMember,
    removeMember,
    setActiveMember,
    setPrimary,
    initializeActiveMember,
    subscribe,
    clearError,
    reset,
  };
};

/**
 * Get avatar color for a family member
 */
export const getAvatarColor = (index: number): string => {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
};
