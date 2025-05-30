import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  SafeAreaView,
  Dimensions, // For potential responsive adjustments
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';

// --- Types ---
interface ThemeColors {
  primary: string;
  inactive: string;
  navBg: string;
  navBorder: string;
  navActiveBg: string;
  shadowColor: string;
}

interface TabConfigItem {
  name: string; // Screen name, also used as animation key
  label: string;
  iconName: keyof typeof Ionicons.glyphMap; // For type safety with Ionicons
  accessibilityLabel: string;
}

interface TabItemProps {
  config: TabConfigItem;
  isActive: boolean;
  onPress: () => void;
  animationValue: Animated.Value;
  colors: ThemeColors;
}

interface NavBarProps {
  theme?: Partial<ThemeColors>;
  initialRouteName?: string; // To set the initial active tab correctly
}

// --- Default Configuration & Theme ---
const DEFAULT_COLORS: ThemeColors = {
  primary: '#6200EA', // Purple
  inactive: '#757575', // Medium Grey
  navBg: '#ffffff',
  navBorder: '#e0e0e0',
  navActiveBg: '#f3eaff', // Lighter purple
  shadowColor: '#000000',
};

const TAB_CONFIG: TabConfigItem[] = [
  {
    name: 'index', // Matches screen name in navigator
    label: 'Home',
    iconName: 'home-outline',
    accessibilityLabel: 'Go to Home screen',
  },
  {
    name: 'addTaskScreen',
    label: 'Add Task',
    iconName: 'add-circle-outline',
    accessibilityLabel: 'Go to Add Task screen',
  },
  {
    name: 'calendarScreen',
    label: 'Calendar',
    iconName: 'calendar-outline',
    accessibilityLabel: 'Go to Calendar screen',
  },
  // Add more tabs here
];

// --- TabItem Component ---
const TabItem: React.FC<TabItemProps> = React.memo(
  ({ config, isActive, onPress, animationValue, colors }) => {
    const iconColor = isActive ? colors.primary : colors.inactive;
    const textColor = isActive ? colors.primary : colors.inactive;

    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.navItemBase,
          isActive && styles.navItemActiveBase,
          isActive && {
            borderBottomColor: colors.primary,
            backgroundColor: colors.navActiveBg,
          },
        ]}
        accessibilityLabel={config.accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Animated.View
          style={[
            styles.navItemContent, // Added for consistent alignment
            { transform: [{ scale: animationValue }] },
          ]}
        >
          <Ionicons name={config.iconName} size={28} color={iconColor} />
          <Text style={[styles.navTextBase, { color: textColor }]}>{config.label}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

// --- NavBar Component ---
const NavBar: React.FC<NavBarProps> = React.memo(({ theme, initialRouteName }) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const mergedColors = { ...DEFAULT_COLORS, ...theme };

  // Determine initial active tab from navigation state or prop
  const getInitialActiveTab = () => {
    try {
      const navState = navigation.getState();
      if (navState?.routes && typeof navState.index === 'number') {
        return navState.routes[navState.index]?.name || initialRouteName || TAB_CONFIG[0].name;
      }
    } catch (e) {
      // Fallback if navigation state is not ready or accessible
      console.warn("NavBar: Could not get initial route from navigation state.", e);
    }
    return initialRouteName || TAB_CONFIG[0].name;
  };

  const [activeTabName, setActiveTabName] = useState<string>(getInitialActiveTab());

  // Initialize animation values dynamically
  const scaleAnims = useRef(
    TAB_CONFIG.reduce((acc, tab) => {
      acc[tab.name] = new Animated.Value(1);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  // Listen to navigation state changes to update active tab
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e) => {
      const currentRoute = e.data.state?.routes[e.data.state.index];
      if (currentRoute && TAB_CONFIG.some(tab => tab.name === currentRoute.name)) {
        setActiveTabName(currentRoute.name);
      }
    });
    return unsubscribe;
  }, [navigation]);

  const handleNavigate = useCallback(
    (screenName: string) => {
      // setActiveTabName(screenName); // Set immediately for responsiveness, though listener will also catch it
      navigation.navigate(screenName);

      if (scaleAnims[screenName]) {
        Animated.sequence([
          Animated.timing(scaleAnims[screenName], {
            toValue: 0.9,
            duration: 60,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(scaleAnims[screenName], {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.back(1.8)), // A slightly more playful bounce
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    [navigation, scaleAnims]
  );

  return (
    <SafeAreaView style={[styles.safeAreaViewWrapper, { backgroundColor: mergedColors.navBg }]}>
      <View
        style={[
          styles.navBarContainer,
          {
            backgroundColor: mergedColors.navBg,
            borderTopColor: mergedColors.navBorder,
            shadowColor: mergedColors.shadowColor,
          },
        ]}
      >
        {TAB_CONFIG.map((tabConfig) => (
          <TabItem
            key={tabConfig.name}
            config={tabConfig}
            isActive={activeTabName === tabConfig.name}
            onPress={() => handleNavigate(tabConfig.name)}
            animationValue={scaleAnims[tabConfig.name]}
            colors={mergedColors}
          />
        ))}
      </View>
    </SafeAreaView>
  );
});

export default NavBar;

const styles = StyleSheet.create({
  safeAreaViewWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // backgroundColor is set dynamically
  },
  navBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'stretch', // Make items stretch to fill height before padding
    height: 60, // Height of the actual bar content, SafeAreaView will add padding
    borderTopWidth: 1,
    // backgroundColor, borderTopColor, shadowColor are set dynamically
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navItemBase: {
    flex: 1, // Each tab takes equal width
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    paddingVertical: 4, // Minimal vertical padding, height is controlled by navBarContainer
    paddingHorizontal: 5,
  },
  navItemActiveBase: {
    // Styles for active tab, like borderBottomWidth, are applied dynamically
    // Ensure this doesn't change item dimensions to prevent layout shifts
    borderBottomWidth: 3, // Example of active indicator (kept from original)
    // Consider alternative indicators that don't change height (e.g. top border, or just color/bg change)
    // backgroundColor is set dynamically
    // borderBottomColor is set dynamically
     borderRadius: 0, // Original had 8, but for bottom border, 0 might look cleaner or target inner view.
                      // If navItemActiveBase gets a distinct background, borderRadius: 8 can make sense.
  },
  navItemContent: { // Wrapper for icon and text for consistent alignment
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTextBase: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});