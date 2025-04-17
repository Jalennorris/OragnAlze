import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextStyle, ViewStyle, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

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
  const pulseValue = useRef(new Animated.Value(1)).current;

  const pulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    pulseAnimation();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
      <TouchableOpacity
        style={[getButtonStyle(variant), style]}
        onPress={onPress}
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
  const navigation = useNavigation();
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const logo = 'OrganAIze';
  const typingSpeed = 150; // Faster typing speed

  // Animation for tasks
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
  const gradientColors = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tasks = [
    { id: '1', title: 'Task 1', description: 'Complete the project documentation' },
    { id: '2', title: 'Task 2', description: 'Review the pull requests' },
    { id: '3', title: 'Task 3', description: 'Plan the next sprint' },
  ];

  useEffect(() => {
    const slideTasks = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: Dimensions.get('window').width,
            duration: 5000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -Dimensions.get('window').width,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    slideTasks();
  }, [slideAnim]);

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
    setTypedText(""); // Reset text when logo changes
    setShowCursor(true); // Ensure cursor shows initially
  
    const interval = setInterval(() => {
      if (index < logo.length) {
        setTypedText((prev) => prev + logo[index]);
        index++;

      } else {
        clearInterval(interval);
        setShowCursor(false);
        setIsTalking(true);
        
        // Ensure fadeAnim is properly animated
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }
    }, typingSpeed);
  
    return () => {
      clearInterval(interval); // Cleanup interval
      setShowCursor(false); // Hide cursor on unmount
    };
  }, [logo, typingSpeed, fadeAnim]); ;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { backgroundColor: gradientInterpolation }]}>
        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradient}>
          <View style={styles.content}>
            <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
              {tasks.map((task, index) => (
                <View 
                  key={task.id} 
                  style={[
                    styles.task, 
                    { 
                      transform: [
                        { translateY: index % 2 === 0 ? 100 : -100 } // Parallax effect
                      ] 
                    }
                  ]}
                >
                  <Typography variant="title" style={styles.taskTitle}>
                    {task.title}
                  </Typography>
                  <Typography variant="body" style={styles.taskDescription}>
                    {task.description}
                  </Typography>
                </View>
              ))}
            </Animated.View>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Typography variant="title" style={styles.logoText}>
                {typedText}
                {showCursor && <Text style={{ opacity: 0.5 }}>|</Text>}
              </Typography>
            </Animated.View>
            <Typography variant="subtitle" style={styles.subtitle}>
              Join us and explore the exciting features we offer.
            </Typography>

            <CustomButton
              title="Get Started"
              onPress={() => navigation.navigate('signup')}
              variant="primary"
              textStyle={{ color: COLORS.primary }}
            />

            <CustomButton
              title="Already have an account? Log In"
              onPress={() => navigation.navigate('login')}
              variant="link"
            />
          </View>
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary, // Match the gradient's starting color
  },
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
    width: '90%',
    alignItems: 'center',
  },
  task: {
    backgroundColor: COLORS.white,
    padding: 8, // Reduced padding
    borderRadius: 8, // Reduced border radius
    marginBottom: 8, // Reduced margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 16, // Reduced font size
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  taskDescription: {
    fontSize: 14, // Reduced font size
    color: COLORS.primary,
  },
  logoText: {
    fontSize: 32, // Reduced font size
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8, // Reduced margin
  },
  subtitle: {
    fontSize: 14, // Reduced font size
    color: COLORS.white,
    marginBottom: 20, // Reduced margin
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    padding: 10, // Reduced padding
    borderRadius: 20, // Reduced border radius
    width: '90%', // Adjusted width
    alignItems: 'center',
    marginBottom: 8, // Reduced margin
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    padding: 10, // Reduced padding
    borderRadius: 20, // Reduced border radius
    width: '90%', // Adjusted width
    alignItems: 'center',
    marginBottom: 8, // Reduced margin
  },
  linkButton: {
    marginTop: 8, // Reduced margin
  },
  title: {
    fontSize: 20, // Reduced font size
    fontWeight: 'bold',
    color: COLORS.white,
  },
  body: {
    fontSize: 14, // Reduced font size
    color: COLORS.white,
  },
  link: {
    fontSize: 14, // Reduced font size
    color: COLORS.white,
    textDecorationLine: 'underline',
  },
});

export default Welcome;