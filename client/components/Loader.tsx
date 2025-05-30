import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme, Animated } from 'react-native';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  colors?: { text: string }; // Backward compatibility
}

const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  color,
  colors,
}) => {
  const scheme = useColorScheme();
  const defaultColor = scheme === 'dark' ? '#fff' : '#000';
  const indicatorColor = color || colors?.text || defaultColor;

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <ActivityIndicator
          size={size}
          color={indicatorColor}
          accessibilityLabel="Loading indicator"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loader;
