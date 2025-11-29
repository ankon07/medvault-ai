/**
 * MediVault AI - Bottom Tab Navigator
 * Main navigation bar with tab icons
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Home, 
  Pill, 
  Calendar, 
  FileText, 
  Plus 
} from 'lucide-react-native';

import { MainTabParamList } from './types';
import { colors, spacing, shadows } from '../theme';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import MedsScreen from '../screens/MedsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ScanScreen from '../screens/ScanScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Custom tab bar button for the center scan button
 */
const ScanTabButton: React.FC<{
  onPress?: () => void;
}> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.scanButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.scanButtonInner}>
        <Plus size={32} color={colors.white} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
};

/**
 * Bottom tab navigator component
 */
export const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          { 
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : spacing['3'],
            height: Platform.OS === 'ios' ? 80 + insets.bottom : 70,
          },
        ],
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Home 
                size={24} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2} 
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Meds"
        component={MedsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Pill 
                size={24} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2} 
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarButton: (props) => <ScanTabButton onPress={props.onPress} />,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Calendar 
                size={24} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2} 
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <FileText 
                size={24} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2} 
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingHorizontal: spacing['4'],
    ...shadows.sm,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['2'],
  },
  scanButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xl,
    shadowColor: colors.primary[600],
  },
});

export default BottomTabNavigator;
