/**
 * MediVault AI - Bottom Tab Navigator with Swipe Gestures
 * Uses Material Top Tabs positioned at bottom for horizontal paging animation
 */

import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  Home, 
  Pill, 
  Calendar, 
  FileText, 
  Plus 
} from 'lucide-react-native';

import { colors, spacing, shadows } from '../theme';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import MedsScreen from '../screens/MedsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HistoryScreen from '../screens/HistoryScreen';

// Tab param list without Scan (Scan opens as modal)
type SwipeableTabParamList = {
  Home: undefined;
  Meds: undefined;
  Schedule: undefined;
  History: undefined;
};

const Tab = createMaterialTopTabNavigator<SwipeableTabParamList>();

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Custom floating scan button that sits above the tab bar
 * Opens Scan screen as a modal from root stack
 */
const FloatingScanButton: React.FC = () => {
  const navigation = useNavigation();
  
  const handlePress = () => {
    // Navigate to Scan screen in root stack (modal)
    navigation.navigate('Scan' as never);
  };

  return (
    <TouchableOpacity
      style={styles.floatingScanButton}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.scanButtonInner}>
        <Plus size={32} color={colors.white} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
};

/**
 * Custom tab bar component positioned at the bottom
 * Includes floating scan button in the center
 */
const CustomTabBar: React.FC<{
  state: any;
  descriptors: any;
  navigation: any;
  insets: { bottom: number };
  onTabPress: (index: number, routeName: string) => void;
}> = ({ state, descriptors, navigation, insets, onTabPress }) => {
  const getIcon = (routeName: string, focused: boolean, color: string) => {
    const strokeWidth = focused ? 2.5 : 2;
    const size = 24;
    
    switch (routeName) {
      case 'Home':
        return <Home size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Meds':
        return <Pill size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Schedule':
        return <Calendar size={size} color={color} strokeWidth={strokeWidth} />;
      case 'History':
        return <FileText size={size} color={color} strokeWidth={strokeWidth} />;
      default:
        return null;
    }
  };

  // Get tab position for inserting scan button in the middle
  const getTabsWithScanButton = () => {
    const tabs: React.ReactNode[] = [];
    const midPoint = Math.floor(state.routes.length / 2);
    
    state.routes.forEach((route: any, index: number) => {
      const { options } = descriptors[route.key];
      const isFocused = state.index === index;

      const handlePress = () => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          // Signal that this is a tap (not swipe) for instant navigation
          onTabPress(index, route.name);
        }
      };

      const onLongPress = () => {
        navigation.emit({
          type: 'tabLongPress',
          target: route.key,
        });
      };

      const color = isFocused ? colors.primary[600] : colors.gray[400];

      // Insert scan button before the middle tabs
      if (index === midPoint) {
        tabs.push(
          <View key="scan-placeholder" style={styles.scanPlaceholder}>
            <FloatingScanButton />
          </View>
        );
      }

      tabs.push(
        <TouchableOpacity
          key={route.key}
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={options.tabBarAccessibilityLabel}
          testID={options.tabBarTestID}
          onPress={handlePress}
          onLongPress={onLongPress}
          style={styles.tabItem}
          activeOpacity={0.7}
        >
          {getIcon(route.name, isFocused, color)}
        </TouchableOpacity>
      );
    });
    
    return tabs;
  };

  return (
    <View 
      style={[
        styles.tabBar, 
        { 
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : spacing['3'],
          height: Platform.OS === 'ios' ? 80 + insets.bottom : 70,
        }
      ]}
    >
      {getTabsWithScanButton()}
    </View>
  );
};

/**
 * Bottom tab navigator component with swipe gesture support
 * Scan screen is NOT included here - it opens as a modal from RootNavigator
 * Uses state-based animation control: swipe animates, tap is instant
 */
export const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const pendingTabIndex = useRef<number | null>(null);

  // Handler for tab press - disables animation temporarily for instant switch
  const handleTabPress = useCallback((index: number) => {
    pendingTabIndex.current = index;
    setAnimationEnabled(false);
  }, []);

  // Re-enable animation after state update
  const handleStateChange = useCallback(() => {
    if (pendingTabIndex.current !== null) {
      // Re-enable animation after the instant navigation completes
      setTimeout(() => {
        setAnimationEnabled(true);
        pendingTabIndex.current = null;
      }, 50);
    }
  }, []);

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: animationEnabled,
        lazy: true,
        lazyPreloadDistance: 1,
      }}
      screenListeners={{
        state: handleStateChange,
      }}
      tabBar={(props) => (
        <CustomTabBar 
          {...props} 
          insets={insets} 
          onTabPress={(index, routeName) => {
            handleTabPress(index);
            // Navigate after disabling animation - cast to any for jumpTo
            (props.navigation as any).jumpTo(routeName);
          }}
        />
      )}
      initialLayout={{ width: SCREEN_WIDTH }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
      />
      <Tab.Screen
        name="Meds"
        component={MedsScreen}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingHorizontal: spacing['4'],
    alignItems: 'flex-start',
    paddingTop: spacing['2'],
    ...shadows.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2'],
  },
  scanPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingScanButton: {
    position: 'absolute',
    top: -32,
    alignSelf: 'center',
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
