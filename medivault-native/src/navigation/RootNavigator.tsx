/**
 * MediVault AI - Root Navigator
 * Main navigation container with stack navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParamList } from './types';
import BottomTabNavigator from './BottomTabNavigator';
import DetailScreen from '../screens/DetailScreen';
import MedDetailScreen from '../screens/MedDetailScreen';
import TestAnalyzerScreen from '../screens/TestAnalyzerScreen';
import LabTestDetailScreen from '../screens/LabTestDetailScreen';
import FamilyMembersScreen from '../screens/FamilyMembersScreen';
import ScanScreen from '../screens/ScanScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root stack navigator
 */
export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen 
        name="Detail" 
        component={DetailScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="MedDetail" 
        component={MedDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="TestAnalyzer" 
        component={TestAnalyzerScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="LabTestDetail" 
        component={LabTestDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="FamilyMembers" 
        component={FamilyMembersScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Scan" 
        component={ScanScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
