import React from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import styles from './AskAIButton.styles';

interface FloatingAIButtonProps {
  onPress: () => void;
  glowAnim: Animated.Value;
  iconRotateAnim: Animated.Value;
  sparkleAnim: Animated.Value;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({
  onPress,
  glowAnim,
  iconRotateAnim,
  sparkleAnim,
  onPressIn,
  onPressOut,
}) => (
  <Animated.View
    style={[
      styles.buttonContainer,
      // scale animation should be handled by parent if needed
    ]}
  >
    <LinearGradient
      colors={['#A6BFFF', '#D1B3FF', '#F3E8FF']}
      start={{ x: 0.1, y: 0.2 }}
      end={{ x: 0.9, y: 0.8 }}
      style={styles.gradientRing}
    >
      <TouchableOpacity
        style={styles.modernButtonTouchable}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel="Ask AI for task suggestions"
        accessibilityRole="button"
        activeOpacity={0.82}
      >
        {/* Glowing Animated Ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.38, 0.92],
              }),
              shadowRadius: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 32],
              }),
              borderColor: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#BB86FC', '#A6BFFF'],
              }),
            },
          ]}
        />
        {/* Glassmorphism Button */}
        <BlurView intensity={90} tint="light" style={styles.glassButton}>
          <LinearGradient
            colors={[
              'rgba(166,191,255,0.92)',
              'rgba(211,179,255,0.90)',
              'rgba(243,232,255,0.88)',
            ]}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.gradientOverlay}
          >
            <View style={styles.innerGlow} />
            <Animated.View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                transform: [
                  {
                    rotate: iconRotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '22deg'],
                    }),
                  },
                ],
              }}
            >
              <Ionicons
                name="planet"
                size={34}
                color="#6C47FF"
                style={{
                  textShadowColor: '#fff',
                  textShadowRadius: 8,
                  opacity: 0.96,
                  borderRadius: 10,
                }}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.sparklePulse,
                {
                  opacity: sparkleAnim,
                  transform: [
                    { scale: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) },
                  ],
                },
              ]}
            >
              <Ionicons name="sparkles" size={18} color="#FFD700" />
            </Animated.View>
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>
    </LinearGradient>
  </Animated.View>
);

export default FloatingAIButton;
