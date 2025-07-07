import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { ANIMATION_DURATION_MEDIUM } from '../utils/aiTaskUtils';

export default function useAnimations() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const suggestionAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const suggestionGradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [glowAnim]);

  useEffect(() => {
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION_MEDIUM,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION_MEDIUM,
          useNativeDriver: true,
        }),
      ])
    );
    sparkleLoop.start();
    return () => sparkleLoop.stop();
  }, [sparkleAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }).start();
    Animated.spring(iconRotateAnim, { toValue: 1, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    Animated.spring(iconRotateAnim, { toValue: 0, useNativeDriver: true }).start();
  };
  const handleSuggestionPressIn = () => {
    Animated.spring(suggestionAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };
  const handleSuggestionPressOut = () => {
    Animated.spring(suggestionAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return {
    scaleAnim,
    sparkleAnim,
    suggestionAnim,
    glowAnim,
    iconRotateAnim,
    suggestionGradientAnim,
    handlePressIn,
    handlePressOut,
    handleSuggestionPressIn,
    handleSuggestionPressOut,
  };
}
