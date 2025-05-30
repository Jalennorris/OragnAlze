import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
  colors: { text: string };
  retryButtonText?: string;
  retryButtonStyle?: ViewStyle;
  retryButtonTextStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  errorMessage,
  onRetry,
  colors,
  retryButtonText = 'Retry',
  retryButtonStyle,
  retryButtonTextStyle,
  containerStyle,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.errorContainer, containerStyle, { opacity: fadeAnim }]}>
      <Ionicons name="warning-outline" size={50} color={colors.text} style={styles.icon} />
      <Text style={[styles.errorText, { color: colors.text }]}>{errorMessage}</Text>
      <TouchableOpacity
        onPress={onRetry}
        style={[styles.retryButton, retryButtonStyle]}
        accessibilityLabel="Retry button"
        accessibilityRole="button"
      >
        <Text style={[styles.retryButtonText, retryButtonTextStyle]}>{retryButtonText}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f44336',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ErrorState;
