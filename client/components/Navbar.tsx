import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  SafeAreaView,
  Dimensions,
  Platform,
  ColorValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
// Add BlurView for glassmorphism
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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
  iconName: string; // Changed from keyof typeof Ionicons.glyphMap to string
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
const MODERN_COLORS: ThemeColors = {
  primary: '#6366F1', // Indigo-500
  inactive: '#9CA3AF', // Gray-400
  navBg: 'rgba(255,255,255,0.55)', // Glassmorphism
  navBorder: 'rgba(120,120,120,0.08)',
  navActiveBg: 'rgba(99,102,241,0.10)', // Indigo-100
  shadowColor: '#6366F1',
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
    label: 'Add',
    iconName: 'add',
    accessibilityLabel: 'Add a new task',
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
    const isAdd = config.name === 'addTaskScreen';
    const iconColor = isAdd && isActive ? '#fff' : isAdd ? colors.primary : isActive ? colors.primary : colors.inactive;
    const textColor = isActive ? colors.primary : colors.inactive;

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.navItemBase,
          isActive && styles.navItemActiveBase,
          isActive && {
            backgroundColor: colors.navActiveBg,
          },
          isAdd && styles.addButtonWrapper,
          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityLabel={config.accessibilityLabel}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
      >
        <Animated.View
          style={[
            styles.navItemContent,
            isAdd && styles.addButton,
            isAdd && isActive && { backgroundColor: 'transparent' },
            isAdd && { shadowColor: colors.primary },
            { transform: [{ scale: animationValue }] },
          ]}
        >
          {isAdd ? (
            <LinearGradient
              colors={isActive ? ['#6366F1', '#A5B4FC'] : ['#fff', '#fff']}
              start={[0, 0]}
              end={[1, 1]}
              style={[
                styles.fabGradient,
                isActive && { shadowColor: colors.primary },
              ]}
            >
              <Ionicons
                name={config.iconName}
                size={28} // reduced from 38
                color={isActive ? '#fff' : colors.primary}
                style={{ marginBottom: 0 }}
              />
            </LinearGradient>
          ) : (
            <>
              <Ionicons
                name={config.iconName}
                size={20} // reduced from 28
                color={iconColor}
                style={{ marginBottom: 0 }}
              />
              <Text style={[styles.navTextBase, { color: textColor }]}>
                {config.label}
              </Text>
            </>
          )}
        </Animated.View>
      </Pressable>
    );
  }
);

// --- NavBar Component ---
const NavBar: React.FC<NavBarProps> = React.memo(({ theme, initialRouteName }) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const mergedColors = { ...MODERN_COLORS, ...theme };

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

  // Animated values for scale and indicator
  const scaleAnims = useRef(
    TAB_CONFIG.reduce((acc, tab) => {
      acc[tab.name] = new Animated.Value(tab.name === activeTabName ? 1.08 : 1);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  const indicatorAnim = useRef(new Animated.Value(TAB_CONFIG.findIndex(t => t.name === activeTabName))).current;

  // Animate active tab on change
  useEffect(() => {
    TAB_CONFIG.forEach(tab => {
      Animated.spring(scaleAnims[tab.name], {
        toValue: tab.name === activeTabName ? 1.08 : 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 7,
      }).start();
    });
    Animated.spring(indicatorAnim, {
      toValue: TAB_CONFIG.findIndex(t => t.name === activeTabName),
      useNativeDriver: false,
      speed: 16,
      bounciness: 7,
    }).start();
  }, [activeTabName]);

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
      Haptics.selectionAsync();
      navigation.navigate(screenName);
    },
    [navigation]
  );

  // Responsive width
  const deviceWidth = Dimensions.get('window').width;
  const maxBarWidth = Math.min(deviceWidth - 16, 420);
  const tabWidth = maxBarWidth / TAB_CONFIG.length;

  return (
    <SafeAreaView style={[styles.safeAreaViewWrapper, { backgroundColor: 'transparent' }]}>
      <BlurView intensity={38} tint="light" style={[
        styles.blurView,
        { width: maxBarWidth, left: (deviceWidth - maxBarWidth) / 2 }
      ]}>
        <View
          style={[
            styles.navBarContainer,
            {
              backgroundColor: mergedColors.navBg,
              borderTopColor: mergedColors.navBorder,
              shadowColor: mergedColors.shadowColor,
              width: maxBarWidth,
              left: 0,
            },
          ]}
        >
          {/* Animated indicator removed */}
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
      </BlurView>
    </SafeAreaView>
  );
});

export default NavBar;

const styles = StyleSheet.create({
  safeAreaViewWrapper: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  blurView: {
    borderRadius: 28,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  navBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 74,
    borderTopWidth: 0,
    borderRadius: 28,
    marginHorizontal: 0,
    marginBottom: 0,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 12,
    backgroundColor: 'transparent',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    position: 'relative',
  },
  navItemBase: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 64,
    height: 64,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  navItemActiveBase: {
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 0,
  },
  navTextBase: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  // Floating action button style for Add tab
  addButtonWrapper: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -40 }], // half of width (80/2)
    bottom: 0, // moved up from -24
    zIndex: 2,
    minWidth: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  addButton: {
    backgroundColor: 'transparent',
    borderRadius: 40,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  fabGradient: {
    borderRadius: 40,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
});