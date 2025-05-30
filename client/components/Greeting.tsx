import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Keyboard,
  // Alert, // Can be replaced by inline error or custom toast
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ensure @expo/vector-icons is installed
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics'; // Import Haptics

// --- Constants ---
const API_BASE_URL = 'http://localhost:8080/api'; // Centralize API URL
const ASYNC_STORAGE_KEYS = {
  DISPLAY_NAME: 'displayName',
  USER_ID: 'userId',
};
const ANIMATION_DURATION = {
  MOUNT: 1000,
  INPUT_TOGGLE: 350,
  SKELETON: 1500, // Duration for skeleton shimmer
};
const COLORS = {
  primary: '#4A6FA5',
  text: '#333333',
  placeholder: '#999999',
  error: '#E74C3C',
  success: '#2ECC71', // Added success color
  background: '#FFFFFF',
  inputBackground: '#FAFAFA',
  buttonBackground: '#F0F4F8',
  borderColor: '#E0E0E0',
  shadow: '#000000',
  skeletonBackground: '#E0E0E0', // Light grey for skeleton
  skeletonHighlight: '#F5F5F5', // Lighter grey for shimmer
};
const MAX_NAME_LENGTH = 30;

// --- Helper Components ---

// Simple Skeleton Loader View
const SkeletonLoader: React.FC<{ width: number | string; height: number; borderRadius?: number }> = ({ width, height, borderRadius = 4 }) => {
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
        return () => animation.stop(); // Cleanup animation on unmount
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200], // Adjust range based on width
    });

    return (
        <View style={[styles.skeletonBase, { width, height, borderRadius }]}>
            <Animated.View
                style={[
                    styles.skeletonShimmer,
                    { transform: [{ translateX }] }
                ]}
            />
        </View>
    );
};


// --- Greeting Component ---
const Greeting: React.FC = () => {
  // --- State ---
  const [displayName, setDisplayName] = useState<string>('');
  const [currentGreeting, setCurrentGreeting] = useState<string>(''); // Start empty, show skeleton initially
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For save operation
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true); // For initial name load
  const [error, setError] = useState<string | null>(null);

  // --- Refs ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const inputWidthAnim = useRef(new Animated.Value(0)).current;
  const textInputRef = useRef<TextInput>(null);

  // --- Callbacks ---

  const generateGreeting = useCallback((name: string): string => {
    // ... (greeting generation logic remains the same)
    if (!name || !name.trim()) return 'Hello there! 👋'; // Default if name is empty

    const currentHour = new Date().getHours();
    const morningEmojis = ['☀️', '☕', '✨'];
    const afternoonEmojis = ['🌤️', '😊', '👍'];
    const eveningEmojis = ['🌙', '🌃', '🌠'];
    let emojis: string[];
    let timeOfDayGreeting: string;

    if (currentHour < 12) {
      timeOfDayGreeting = 'Good Morning';
      emojis = morningEmojis;
    } else if (currentHour < 18) {
      timeOfDayGreeting = 'Good Afternoon';
      emojis = afternoonEmojis;
    } else {
      timeOfDayGreeting = 'Good Evening';
      emojis = eveningEmojis;
    }
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    // Add non-breaking space before emoji for better wrapping
    return `${timeOfDayGreeting}, ${name}! \u00A0${randomEmoji}`;
  }, []);

  const getUserId = async (): Promise<string | null> => {
    // ... (getUserId logic remains the same)
     try {
      const userId = await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.USER_ID);
      if (!userId) {
        console.warn('User ID not found in AsyncStorage.');
      }
      return userId;
    } catch (err) {
      console.error('Failed to retrieve User ID:', err);
      return null;
    }
  };

  const loadInitialDisplayName = useCallback(async () => {
    setIsInitialLoading(true); // Start loading state
    try {
      const storedDisplayName = await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.DISPLAY_NAME);
      if (storedDisplayName) {
        setDisplayName(storedDisplayName);
        setCurrentGreeting(generateGreeting(storedDisplayName));
      } else {
        setCurrentGreeting(generateGreeting('')); // Use default greeting
      }
    } catch (err) {
      console.error('Failed to load display name from storage:', err);
      setError('Could not load your name.');
      setCurrentGreeting('Hello there! 👋'); // Fallback greeting on error
    } finally {
       // Add a small delay before hiding skeleton for smoother transition
       setTimeout(() => setIsInitialLoading(false), 300);
    }
  }, [generateGreeting]);

  // ** Optimistic UI Save **
  const handleSaveChanges = useCallback(async () => {
    const trimmedName = displayName.trim();
    const previousName = await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.DISPLAY_NAME) || ''; // Get previous name for potential revert

    // --- Validation ---
    if (!trimmedName) {
      setError('Name cannot be empty.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Haptic feedback for error
      return;
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      setError(`Name is too long (max ${MAX_NAME_LENGTH} chars).`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // --- Start Save Process ---
    setIsLoading(true);
    setError(null);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Haptic feedback for action start

    // --- Optimistic Update ---
    // Update UI immediately, assuming success
    const newGreeting = generateGreeting(trimmedName);
    setCurrentGreeting(newGreeting);
    setDisplayName(trimmedName); // Update local state
    setIsEditing(false); // Exit edit mode optimistically

    // --- Get User ID ---
    const userId = await getUserId();
    if (!userId) {
      setError('Could not identify user. Please log in again.');
      // Revert UI changes
      setCurrentGreeting(generateGreeting(previousName));
      setDisplayName(previousName);
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // --- API Call & Storage Update ---
    try {
      // Update AsyncStorage first (faster feedback if API fails later)
      await AsyncStorage.setItem(ASYNC_STORAGE_KEYS.DISPLAY_NAME, trimmedName);

      // API Call
      await axios.patch(`${API_BASE_URL}/users/${userId}`, {
        display_name: trimmedName,
      });

      // Success! UI is already updated. Maybe add success haptic.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (err: any) {
      console.error('Error saving display name:', err);
      // --- Revert UI on Error ---
      setError('Failed to save name. Please try again.');
      setCurrentGreeting(generateGreeting(previousName)); // Revert greeting
      setDisplayName(previousName); // Revert name state
      // Optionally remove from AsyncStorage if API failed? Or leave it for next load?
      // await AsyncStorage.setItem(ASYNC_STORAGE_KEYS.DISPLAY_NAME, previousName);
      setIsEditing(true); // Re-enter editing mode on failure
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    } finally {
      setIsLoading(false); // Stop loading indicator regardless of outcome
    }
  }, [displayName, generateGreeting]);

  const handleToggleEdit = useCallback(() => {
    if (isEditing) {
      handleSaveChanges(); // Attempt save
    } else {
      setIsEditing(true);
      // Trigger light haptic feedback for opening edit mode
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => textInputRef.current?.focus(), 100);
    }
  }, [isEditing, handleSaveChanges]);

  // --- Effects ---

  useEffect(() => {
    loadInitialDisplayName();
  }, [loadInitialDisplayName]);

  useEffect(() => {
    // Entry animations (remain the same)
     Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION.MOUNT,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION.MOUNT,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  useEffect(() => {
    // Input width animation (remains the same)
     Animated.timing(inputWidthAnim, {
      toValue: isEditing ? 1 : 0,
      duration: ANIMATION_DURATION.INPUT_TOGGLE,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isEditing, inputWidthAnim]);

  // --- Dynamic Styles ---
  const animatedInputStyle = {
    // (interpolation remains the same)
     width: inputWidthAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '70%'], // Animate width percentage or fixed value
    }),
    opacity: inputWidthAnim.interpolate({ // Fade in/out input smoothly
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    }),
    marginRight: inputWidthAnim.interpolate({ // Add margin when input is visible
        inputRange: [0, 1],
        outputRange: [0, 8],
    })
  };

  // --- Render ---
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [ { scale: scaleAnim }, { translateY: slideAnim } ]
        }
      ]}
    >
      {/* Conditional Rendering: Skeleton or Greeting */}
      {isInitialLoading ? (
          <View style={styles.greetingContainer}>
              <SkeletonLoader width="80%" height={30} borderRadius={8} />
          </View>
      ) : (
          <Text style={styles.greeting} numberOfLines={2} ellipsizeMode="tail">
              {currentGreeting}
          </Text>
      )}

      {/* Edit Section */}
      <View style={styles.editContainer}>
        <Animated.View style={[styles.inputWrapper, animatedInputStyle]}>
          {isEditing && (
            <TextInput
              ref={textInputRef}
              style={[styles.input, error ? styles.inputError : null]} // Highlight input on error
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (error) setError(null); // Clear error on typing
              }}
              placeholder="Your Name"
              placeholderTextColor={COLORS.placeholder}
              maxLength={MAX_NAME_LENGTH}
              onSubmitEditing={handleSaveChanges}
              autoCapitalize="words"
              returnKeyType="done"
              editable={!isLoading}
              selectTextOnFocus
              blurOnSubmit={false} // Keep keyboard potentially open if save fails
            />
          )}
        </Animated.View>

        <TouchableOpacity
          onPress={handleToggleEdit}
          style={styles.editButton}
          disabled={isLoading || isInitialLoading} // Disable during initial load too
          activeOpacity={0.7}
          // Accessibility Props
          accessibilityRole="button"
          accessibilityLabel={isEditing ? "Save display name" : "Edit display name"}
          accessibilityHint={isEditing ? "Updates your greeting name" : "Allows you to change your greeting name"}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons
              name={isEditing ? 'checkmark-circle-outline' : 'create-outline'}
              size={24}
              color={isEditing ? COLORS.primary : COLORS.text}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Error Message Display */}
      {error && !isInitialLoading && ( // Don't show save errors during initial load
        <Text style={styles.errorText} accessibilityLiveRegion="assertive">
            {error}
        </Text>
      )}
    </Animated.View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  // Adjusted container for smaller height
  greetingContainer: {
      height: 36, // Reduced from 50
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12, // Slightly reduced margin
      width: '100%',
  },
  greeting: {
    fontSize: Platform.select({ ios: 20, android: 18 }), // Reduced font size
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12, // Reduced margin
    paddingHorizontal: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    minHeight: 36, // Reduced from 50
    lineHeight: Platform.select({ ios: 24, android: 22 }), // Reduced line spacing
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 44,
  },
  inputWrapper: {
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.inputBackground,
    height: 44,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputError: {
      borderColor: COLORS.error, // Highlight border red on error
      backgroundColor: '#FFF0F0', // Slight red background tint on error
  },
  editButton: {
    padding: 10,
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '500', // Make error slightly bolder
    marginTop: 12, // Increased margin
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  // Skeleton Styles
  skeletonBase: {
      backgroundColor: COLORS.skeletonBackground,
      overflow: 'hidden', // Important for shimmer effect
  },
  skeletonShimmer: {
      width: '50%', // Width of the shimmer highlight
      height: '100%',
      backgroundColor: COLORS.skeletonHighlight,
      opacity: 0.6, // Make shimmer slightly transparent
  },
});

export default Greeting;
