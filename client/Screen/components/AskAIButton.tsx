import React, { useRef, useState } from 'react';
import { TouchableOpacity, Animated, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AskAIButtonProps {
  onPress: () => void;
}

const AskAIButton: React.FC<AskAIButtonProps> = ({ onPress }) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.buttonContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel="Ask AI for assistance"
      >
        <View style={styles.faceContainer}>
          <View style={styles.eyes}>
            <View style={[styles.eye, isPressed && styles.eyeSquint]} />
            <View style={[styles.eye, isPressed && styles.eyeSquint, { marginLeft: 10 }]} />
          </View>
          {isPressed ? (
            <View style={styles.mouthOpen} />
          ) : (
            <View style={styles.mouthClosed} />
          )}
          <Ionicons name="sparkles" size={16} color="#FFD700" style={styles.sparkle1} />
          <Ionicons name="sparkles" size={16} color="#FFD700" style={styles.sparkle2} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 10,
    elevation: 10,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff', // Change to white
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', // Add shadow color
    shadowOffset: { width: 0, height: 4 }, // Add shadow offset
    shadowOpacity: 0.3, // Add shadow opacity
    shadowRadius: 6, // Add shadow radius
  },
  faceContainer: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  eyes: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  eye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000', // Change to black
  },
  eyeSquint: {
    height: 6,
    marginTop: 4,
  },
  mouthClosed: {
    width: 20,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#000', // Change to black
    alignSelf: 'center',
  },
  mouthOpen: {
    width: 20,
    height: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000', // Change to black
    backgroundColor: '#fff', // Change to white
    alignSelf: 'center',
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    left: -10,
    transform: [{ rotate: '-20deg' }],
  },
  sparkle2: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    transform: [{ rotate: '20deg' }],
  },
});

export default AskAIButton;
