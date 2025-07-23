import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Keyboard,
  Dimensions,
  AccessibilityRole,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// --- Constants ---
const API_BASE_URL = 'http://localhost:8080/api';
const ASYNC_STORAGE_KEYS = {
  DISPLAY_NAME: 'displayName',
  USER_ID: 'userId',
};
const ANIMATION_DURATION = {
  MOUNT: 900,
  INPUT_TOGGLE: 350,
  SKELETON: 1200,
  GREETING: 500,
  CONFETTI: 900,
};
const COLORS = {
  primary: '#7C3AED',
  accent: '#C4B5FD',
  text: '#18181B',
  placeholder: '#A1A1AA',
  error: '#EF4444',
  success: '#22D3EE',
  background: 'rgba(255,255,255,0.7)',
  inputBackground: 'rgba(245,245,255,0.85)',
  buttonBackground: '#F3F4F6',
  borderColor: '#E0E7FF',
  shadow: '#7C3AED',
  skeletonBackground: '#E0E7FF',
  skeletonHighlight: '#F1F5F9',
  glass: 'rgba(255,255,255,0.5)',
  darkText: '#18181B',
  // Modern blue-cyan-violet gradient
  gradient1: '#60A5FA', // blue-400
  gradient2: '#38BDF8', // sky-400
  gradient3: '#22D3EE', // cyan-400
  gradient4: '#A5B4FC', // indigo-200
  gradient5: '#C084FC', // violet-400
};
const MAX_NAME_LENGTH = 30;

// --- Helper Components ---

// Modern Skeleton Loader with shimmer
const SkeletonLoader: React.FC<{ width: number | string; height: number; borderRadius?: number }> = ({ width, height, borderRadius = 12 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION.SKELETON,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });
  return (
    <View style={[styles.skeletonBase, { width, height, borderRadius }]}>
      <Animated.View
        style={[
          styles.skeletonShimmer,
          {
            transform: [{ translateX }],
            borderRadius,
          },
        ]}
      />
    </View>
  );
};

// Animated Gradient BG
const AnimatedGradientBG: React.FC = () => {
  const colorAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(colorAnim, { toValue: 0, duration: 4000, useNativeDriver: false }),
      ])
    ).start();
  }, [colorAnim]);
  const bgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'rgba(99,102,241,0.10)',
      'rgba(165,180,252,0.18)',
    ],
  });
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, zIndex: -1 }]} />;
};

// Animated Gradient Border Avatar
const AnimatedAvatar: React.FC<{ name: string }> = ({ name }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '👤';
  return (
    <Animated.View style={[styles.avatarBorder, { transform: [{ rotate: spin }] }]}>
      <LinearGradient
        colors={[
          COLORS.gradient1,
          COLORS.gradient2,
          COLORS.gradient3,
          COLORS.gradient4,
          COLORS.gradient5,
          COLORS.gradient1
        ]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.avatarGradient}
      >
        <View style={styles.avatarInner}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Floating Label Input
const FloatingLabelInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  editable: boolean;
  error?: boolean;
  inputRef: React.RefObject<TextInput>;
  placeholder: string;
  maxLength: number;
}> = ({
  value,
  onChangeText,
  onSubmitEditing,
  editable,
  error,
  inputRef,
  placeholder,
  maxLength,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, labelAnim]);
  const labelStyle = {
    top: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, -8] }),
    left: 18,
    fontSize: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [17, 13] }),
    color: error ? COLORS.error : COLORS.placeholder,
    backgroundColor: 'transparent',
    position: 'absolute' as const,
    paddingHorizontal: 2,
    zIndex: 2,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next Rounded' : 'sans-serif-medium',
    letterSpacing: 0.1,
  };
  return (
    <View style={{ position: 'relative', width: '100%' }}>
      {/* Only show label if value is empty */}
      {(!value || value.length === 0) && (
        <Animated.Text style={labelStyle} pointerEvents="none">
          {placeholder}
        </Animated.Text>
      )}
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          error ? styles.inputError : null,
          { paddingTop: 20, paddingBottom: 8 },
        ]}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmitEditing}
        autoCapitalize="words"
        returnKeyType="done"
        editable={editable}
        selectTextOnFocus
        blurOnSubmit={false}
        accessibilityLabel={placeholder}
        accessibilityHint="Enter your name and press save"
        testID="floating-label-input"
      />
    </View>
  );
};

// Confetti Burst (emoji burst)
const ConfettiBurst: React.FC<{ show: boolean }> = ({ show }) => {
  const confettiAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (show) {
      confettiAnim.setValue(0);
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION.CONFETTI,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }).start();
    }
  }, [show]);
  if (!show) return null;
  const emojis = ['🎉', '✨', '🥳', '🎊', '💫', '🌈'];
  return (
    <View pointerEvents="none" style={styles.confettiContainer}>
      {emojis.map((emoji, i) => {
        const angle = (i / emojis.length) * 2 * Math.PI;
        const radius = confettiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 60],
        });
        const x = radius.interpolate({
          inputRange: [0, 60],
          outputRange: [0, Math.cos(angle) * 60],
        });
        const y = radius.interpolate({
          inputRange: [0, 60],
          outputRange: [0, Math.sin(angle) * 60],
        });
        return (
          <Animated.Text
            key={emoji}
            style={[
              styles.confettiEmoji,
              {
                opacity: confettiAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 0] }),
                transform: [
                  { translateX: x },
                  { translateY: y },
                  { scale: confettiAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.2, 0.7] }) },
                ],
              },
            ]}
          >
            {emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
};

// --- Greeting Component ---
const Greeting: React.FC = () => {
  // --- State ---
  const [displayName, setDisplayName] = useState<string>('');
  const [currentGreeting, setCurrentGreeting] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // --- Refs ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const inputWidthAnim = useRef(new Animated.Value(0)).current;
  const textInputRef = useRef<TextInput>(null);

  // --- Callbacks ---
  const generateGreeting = useCallback((name: string): string => {
    if (!name || !name.trim()) return 'Welcome! 👋';
    const hour = new Date().getHours();
    const greetings = [
      { label: 'Good Morning', emojis: ['🌅', '☀️', '🌞'] },
      { label: 'Good Afternoon', emojis: ['🌤️', '😃', '🌻'] },
      { label: 'Good Evening', emojis: ['🌙', '🌌', '🌠'] },
    ];
    const idx = hour < 12 ? 0 : hour < 18 ? 1 : 2;
    const { label, emojis } = greetings[idx];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    return `${label}, ${name}! ${emoji}`;
  }, []);

  const getUserId = async (): Promise<string | null> => {
    try {
      const userId = await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.USER_ID);
      return userId;
    } catch {
      return null;
    }
  };

  const loadInitialDisplayName = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const storedDisplayName = await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.DISPLAY_NAME);
      if (storedDisplayName) {
        setDisplayName(storedDisplayName);
        setCurrentGreeting(generateGreeting(storedDisplayName));
      } else {
        setCurrentGreeting(generateGreeting(''));
      }
    } catch {
      setError('Could not load your name.');
      setCurrentGreeting('Welcome! 👋');
    } finally {
      setTimeout(() => setIsInitialLoading(false), 250);
    }
  }, [generateGreeting]);

  const handleSaveChanges = useCallback(async () => {
    const trimmedName = displayName.trim();
    const previousName = (await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.DISPLAY_NAME)) || '';
    if (!trimmedName) {
      setError('Name cannot be empty.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      setError(`Name too long (max ${MAX_NAME_LENGTH})`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsLoading(true);
    setError(null);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentGreeting(generateGreeting(trimmedName));
    setDisplayName(trimmedName);
    setIsEditing(false);
    const userId = await getUserId();
    if (!userId) {
      setError('Could not identify user.');
      setCurrentGreeting(generateGreeting(previousName));
      setDisplayName(previousName);
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEYS.DISPLAY_NAME, trimmedName);
      await axios.patch(`${API_BASE_URL}/users/${userId}`, {
        display_name: trimmedName,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), ANIMATION_DURATION.CONFETTI + 200);
    } catch {
      setError('Failed to save. Try again.');
      setCurrentGreeting(generateGreeting(previousName));
      setDisplayName(previousName);
      setIsEditing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [displayName, generateGreeting]);

  const handleToggleEdit = useCallback(() => {
    if (isEditing) {
      handleSaveChanges();
    } else {
      setIsEditing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => textInputRef.current?.focus(), 120);
    }
  }, [isEditing, handleSaveChanges]);

  const handleCancelEdit = useCallback(async () => {
    setIsEditing(false);
    setError(null);
    const storedDisplayName = await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.DISPLAY_NAME);
    setDisplayName(storedDisplayName || '');
  }, []);

  // --- Effects ---
  useEffect(() => {
    loadInitialDisplayName();
  }, [loadInitialDisplayName]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION.MOUNT,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION.MOUNT,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  useEffect(() => {
    Animated.timing(inputWidthAnim, {
      toValue: isEditing ? 1 : 0,
      duration: ANIMATION_DURATION.INPUT_TOGGLE,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isEditing, inputWidthAnim]);

  // Greeting slide-in and fade
  const greetingSlide = useRef(new Animated.Value(-30)).current;
  const greetingFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isInitialLoading) {
      greetingSlide.setValue(-30);
      greetingFade.setValue(0);
      Animated.parallel([
        Animated.timing(greetingSlide, {
          toValue: 0,
          duration: ANIMATION_DURATION.GREETING,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.timing(greetingFade, {
          toValue: 1,
          duration: ANIMATION_DURATION.GREETING,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isInitialLoading, currentGreeting]);

  // Button scale animation
  const buttonScale = useRef(new Animated.Value(1)).current;
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  // --- Dynamic Styles ---
  const animatedInputStyle = {
    width: inputWidthAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '72%'],
    }),
    opacity: inputWidthAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    }),
    marginRight: inputWidthAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10],
    }),
  };

  // --- Render ---
  return (
    <View style={{ alignItems: 'center' }}>
      <BlurView intensity={60} tint="light" style={styles.blurCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.7)', 'rgba(236,233,254,0.8)', 'rgba(255,255,255,0.6)']}
          style={StyleSheet.absoluteFill}
          start={[0.1, 0.1]}
          end={[0.9, 0.9]}
        />
        <AnimatedGradientBG />
        <ConfettiBurst show={showConfetti} />
        <View style={styles.headerRow}>
          <AnimatedAvatar name={displayName} />
          <View style={{ flex: 1 }}>
            {isInitialLoading ? (
              <SkeletonLoader width="90%" height={32} borderRadius={12} />
            ) : (
              <Animated.Text
                style={[
                  styles.greeting,
                  {
                    opacity: greetingFade,
                    transform: [{ translateX: greetingSlide }],
                    textShadowColor: 'rgba(124,58,237,0.10)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 8,
                  },
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
                accessibilityLiveRegion="polite"
                testID="greeting-text"
              >
                {currentGreeting}
              </Animated.Text>
            )}
          </View>
        </View>
        <View style={styles.editContainer}>
          <Animated.View style={[styles.inputWrapper, animatedInputStyle]}>
            {isEditing && (
              <FloatingLabelInput
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (error) setError(null);
                }}
                onSubmitEditing={handleSaveChanges}
                editable={!isLoading}
                error={!!error}
                inputRef={textInputRef}
                placeholder='Enter your name'
                maxLength={MAX_NAME_LENGTH}
              />
            )}
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={() => {
                animateButton();
                handleToggleEdit();
              }}
              android_ripple={{ color: COLORS.accent, borderless: true }}
              style={({ pressed }) => [
                styles.editButton,
                isEditing && styles.editButtonActive,
                pressed && { opacity: 0.7 },
              ]}
              disabled={isLoading || isInitialLoading}
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Save display name' : 'Edit display name'}
              accessibilityHint={isEditing ? 'Updates your greeting name' : 'Allows you to change your greeting name'}
              testID="edit-button"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons
                  name={isEditing ? 'checkmark-circle-outline' : 'create-outline'}
                  size={26}
                  color={isEditing ? COLORS.primary : COLORS.darkText}
                />
              )}
            </Pressable>
          </Animated.View>
          {isEditing && (
            <Pressable
              onPress={handleCancelEdit}
              android_ripple={{ color: COLORS.error, borderless: true }}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
              accessibilityHint="Discard changes and exit edit mode"
              testID="cancel-edit-button"
            >
              <Ionicons name="close-outline" size={24} color={COLORS.error} />
            </Pressable>
          )}
        </View>
        {error && !isInitialLoading && (
          <Text style={styles.errorText} accessibilityLiveRegion="assertive" testID="error-text">
            {error}
          </Text>
        )}
      </BlurView>
    </View>
  );
};

// --- Styles ---
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  blurCard: {
    width: width - 32,
    alignSelf: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    marginVertical: 22,
    padding: 0,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  avatarBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  avatarInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next Rounded' : 'sans-serif-black',
    letterSpacing: 0.2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.darkText,
    textAlign: 'left',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next Rounded' : 'sans-serif-medium',
    minHeight: 32,
    lineHeight: 34,
    letterSpacing: 0.13,
    paddingRight: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    minHeight: 54,
    gap: 10,
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  inputWrapper: {
    overflow: 'hidden',
    justifyContent: 'center',
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 17,
    color: COLORS.darkText,
    backgroundColor: COLORS.inputBackground,
    height: 54,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next Rounded' : 'sans-serif',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    marginTop: 0,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF1F2',
  },
  editButton: {
    padding: 10,
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  editButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.primary,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginLeft: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
    letterSpacing: 0.1,
  },
  skeletonBase: {
    backgroundColor: COLORS.skeletonBackground,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  skeletonShimmer: {
    width: '60%',
    height: '100%',
    backgroundColor: COLORS.skeletonHighlight,
    opacity: 0.7,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  confettiContainer: {
    position: 'absolute',
    left: '50%',
    top: 36,
    width: 0,
    height: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiEmoji: {
    position: 'absolute',
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default Greeting;
