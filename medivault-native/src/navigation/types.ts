/**
 * MediVault AI - Navigation Types
 * Type definitions for React Navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Medication } from '../types';

/**
 * Auth stack param list (unauthenticated users)
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

/**
 * Root stack param list (authenticated users)
 */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Detail: { recordId: string };
  MedDetail: { medication: Medication; sourceId?: string };
  TestAnalyzer: undefined;
  LabTestDetail: { labTestId: string };
  FamilyMembers: undefined;
  Scan: undefined;
};

/**
 * Main tab param list
 */
export type MainTabParamList = {
  Home: undefined;
  Meds: undefined;
  Scan: undefined;
  Schedule: undefined;
  History: undefined;
};

/**
 * Screen props for auth stack screens
 */
export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

/**
 * Screen props for root stack screens
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

/**
 * Screen props for tab screens
 */
export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  BottomTabScreenProps<MainTabParamList, T>;

/**
 * Merged navigation prop type
 */
export type CompositeScreenProps<
  T extends keyof MainTabParamList
> = MainTabScreenProps<T> & {
  navigation: RootStackScreenProps<'MainTabs'>['navigation'];
};

// Declare global types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList, AuthStackParamList {}
  }
}
