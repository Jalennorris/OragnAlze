import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextStyle, ViewStyle, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Constants
const COLORS = {
  primary: '#6a11cb',
  secondary: '#2575fc',
  white: '#fff',
};

// Reusable Typography Component
interface TypographyProps {
  variant?: 'title' | 'subtitle' | 'body' | 'link';
  style?: TextStyle;
  children: React.ReactNode;
}

const Typography: React.FC<TypographyProps> = ({ variant = 'body', style, children }) => {
  const getStyle = () => {
    switch (variant) {
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'link':
        return styles.link;
      default:
        return styles.body;
    }
  };

  return <Text style={[getStyle(), style]}>{children}</Text>;
};

// Reusable Button Component
interface CustomButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'link';
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
}) => {
  const opacityValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacityValue, {
      toValue: 0.8,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ opacity: opacityValue }}>
      <TouchableOpacity
        style={[getButtonStyle(variant), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Typography variant={variant === 'link' ? 'link' : 'body'} style={textStyle}>
          {title}
        </Typography>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getButtonStyle = (variant: string): ViewStyle => {
  switch (variant) {
    case 'primary':
      return styles.primaryButton;
    case 'secondary':
      return styles.secondaryButton;
    case 'link':
      return styles.linkButton;
    default:
      return styles.primaryButton;
  }
};

// Main Welcome Component
const Welcome: React.FC = () => {
  const router = useRouter();
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const logo = 'OrganAIze';
  const typingSpeed = 150; // Faster typing speed

  // Animation for the smiley face
  const scaleValue = useRef(new Animated.Value(1)).current;
  const gradientColors = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateSmiley = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    if (isTalking) {
      animateSmiley();
    } else {
      scaleValue.setValue(1); // Reset scale when not talking
    }
  }, [isTalking, scaleValue]);

  // Gradient transition animation
  useEffect(() => {
    Animated.timing(gradientColors, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, []);

  const gradientInterpolation = gradientColors.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.primary, COLORS.secondary],
  });

  // Typewriter effect for logo text
  useEffect(() => {
    if (!logo) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < logo.length) {
        setTypedText((prev) => prev + logo[index]);
        index++;
      } else {
        clearInterval(interval);
        setShowCursor(false);
        setIsTalking(true);
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [logo]);

  return (
    <Animated.View style={[styles.container, { backgroundColor: gradientInterpolation }]}>
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradient}>
        <View style={styles.content}>
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <Ionicons
              name={isTalking ? 'happy' : 'happy-outline'}
              size={100}
              color={COLORS.white}
              style={styles.icon}
            />
          </Animated.View>
          <Typography variant="title" style={styles.logoText}>
            {typedText}
            {showCursor && <Text style={{ opacity: 0.5 }}>|</Text>}
          </Typography>
          <Typography variant="subtitle" style={styles.subtitle}>
            Join us and explore the exciting features we offer.
          </Typography>

          <CustomButton
            title="Get Started"
            onPress={() => router.push('/signup')}
            variant="primary"
            textStyle={{ color: COLORS.primary }}
          />

          <CustomButton
            title="Already have an account? Log In"
            onPress={() => router.push('/login')}
            variant="link"
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 30,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  linkButton: {
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  body: {
    fontSize: 16,
    color: COLORS.white,
  },
  link: {
    fontSize: 16,
    color: COLORS.white,
    textDecorationLine: 'underline',
  },
});

export default Welcome;