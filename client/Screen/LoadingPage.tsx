import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#6a11cb',
  secondary: '#2575fc',
  accent: '#43e97b',
  white: '#fff',
  glow: 'rgba(67,233,123,0.4)',
};

const LoadingPage: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [rotateAnim, glowAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
      start={{ x: 0.1, y: 0.2 }}
      end={{ x: 0.9, y: 0.8 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.glowCircle,
            {
              opacity: glowAnim,
              shadowColor: COLORS.glow,
              shadowOpacity: 1,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="logo-react" size={110} color={COLORS.white} />
          </Animated.View>
        </Animated.View>
        <Text style={styles.loadingText}>OrganAIzing your experience...</Text>
        <Text style={styles.tagline}>AI-powered productivity, just for you</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glowCircle: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 80,
    padding: 24,
    marginBottom: 32,
    shadowColor: COLORS.glow,
    shadowOpacity: 1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  loadingText: {
    marginTop: 8,
    fontSize: 22,
    color: COLORS.white,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'System',
    textAlign: 'center',
    opacity: 0.95,
  },
  tagline: {
    marginTop: 12,
    fontSize: 15,
    color: '#e0e0e0',
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'center',
    opacity: 0.8,
    letterSpacing: 0.2,
  },
});

export default LoadingPage;