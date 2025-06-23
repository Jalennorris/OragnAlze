import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextStyle, ViewStyle, Animated, Easing, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

// Constants
const COLORS = {
  primary: '#6a11cb',
  secondary: '#2575fc',
  accent: '#ffb347',
  white: '#fff',
  glass: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.25)',
  textDark: '#22223b',
};

// Typography Component
interface TypographyProps {
  variant?: 'hero' | 'title' | 'subtitle' | 'body' | 'link';
  style?: TextStyle;
  children: React.ReactNode;
}

const Typography: React.FC<TypographyProps> = ({ variant = 'body', style, children }) => {
  const getStyle = () => {
    switch (variant) {
      case 'hero':
        return styles.hero;
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

// Button Component
interface CustomButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'link';
  icon?: React.ReactNode;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
  icon,
}) => (
  <TouchableOpacity
    style={[getButtonStyle(variant), style]}
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityRole="button"
  >
    {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
    <Typography variant={variant === 'link' ? 'link' : 'body'} style={textStyle}>
      {title}
    </Typography>
  </TouchableOpacity>
);

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
  const navigation = useNavigation();
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const logo = 'OrganAIze'; // Ensure correct casing
  const typingSpeed = 200;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;

  const tasks = [
    { id: '1', title: 'Smart Scheduling', description: 'Let AI optimize your daily agenda.' },
    { id: '2', title: 'Team Collaboration', description: 'Share and track tasks with your team.' },
    { id: '3', title: 'Progress Insights', description: 'Visualize your productivity trends.' },
  ];

  // Typewriter effect for logo
  useEffect(() => {
    let index = 0;
    setTypedText('');
    setShowCursor(true);

    const interval = setInterval(() => {
      if (index < logo.length - 1) {
        setTypedText((prev) => prev + logo[index]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowCursor(false), 600);
        Animated.timing(heroAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 800,
          delay: 200,
          useNativeDriver: true,
        }).start();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          delay: 400,
          useNativeDriver: true,
        }).start();
      }
    }, typingSpeed);

    return () => {
      clearInterval(interval);
      setShowCursor(false);
    };
  }, [logo, typingSpeed, heroAnim, cardAnim, fadeAnim]);

  // Blinking cursor animation
  useEffect(() => {
    if (!showCursor) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(cursorAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    ).start();
    return () => cursorAnim.stopAnimation();
  }, [showCursor, cursorAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.gradient}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.centeredContent}>
          {/* Hero Logo */}
          <Animated.View
            style={[
              styles.heroContainer,
              {
                opacity: heroAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
                transform: [
                  {
                    translateY: heroAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Typography variant="hero" style={styles.logoText}>
              {typedText}
              {showCursor ? (
                <Animated.Text
                  style={{
                    opacity: cursorAnim,
                    color: COLORS.accent,
                    fontWeight: 'bold',
                  }}
                >
                  |
                </Animated.Text>
              ) : null}
            </Typography>
            <Typography variant="subtitle" style={styles.heroSubtitle}>
              AI-powered productivity, reimagined.
            </Typography>
          </Animated.View>

          {/* Glassmorphism Task Cards */}
          <Animated.View
            style={[
              styles.tasksRow,
              {
                opacity: cardAnim,
                transform: [
                  {
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <Typography variant="title" style={styles.taskTitle}>
                  {task.title}
                </Typography>
                <Typography variant="body" style={styles.taskDescription}>
                  {task.description}
                </Typography>
              </View>
            ))}
          </Animated.View>

          {/* CTA Buttons */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              width: '100%',
              alignItems: 'center',
              marginTop: 40,
            }}
          >
            <CustomButton
              title="Get Started"
              onPress={() => navigation.navigate('signup')}
              variant="primary"
              textStyle={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 18 }}
              style={{
                marginBottom: 16,
                shadowColor: COLORS.primary,
                shadowOpacity: 0.18,
                shadowRadius: 12,
                elevation: 3,
              }}
            />
            <CustomButton
              title="Already have an account? Log In"
              onPress={() => navigation.navigate('login')}
              variant="link"
              textStyle={{ color: COLORS.white, fontSize: 16 }}
            />
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  hero: {
    fontSize: 54,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2.5,
    textShadowColor: COLORS.secondary,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 16,
  },
  logoText: {
    fontSize: 54,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2.5,
    marginBottom: 10,
    textShadowColor: COLORS.secondary,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 16,
  },
  heroSubtitle: {
    fontSize: 20,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.7,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  tasksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
    width: '100%',
  },
  taskCard: {
    flex: 1,
    minWidth: 110,
    maxWidth: 150,
    marginHorizontal: 8,
    padding: 20,
    borderRadius: 22,
    backgroundColor: COLORS.glass,
    borderColor: COLORS.border,
    borderWidth: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
    backdropFilter: Platform.OS === 'web' ? 'blur(18px)' : undefined,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 6,
    letterSpacing: 0.7,
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.textDark,
    opacity: 0.85,
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 32,
    width: '90%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: 32,
    width: '90%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkButton: {
    marginTop: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 12,
    textAlign: 'center',
    opacity: 0.88,
  },
  body: {
    fontSize: 16,
    color: COLORS.white,
  },
  link: {
    fontSize: 16,
    color: COLORS.white,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

export default Welcome;