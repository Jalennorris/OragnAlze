import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Constants
const COLORS = {
  primary: '#6a11cb',
  secondary: '#2575fc',
  white: '#fff',
};

const Welcome: React.FC = () => {
  const router = useRouter();

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="happy-outline" size={100} color={COLORS.white} style={styles.icon} />
        <Text style={styles.title}>Welcome to Our App!</Text>
        <Text style={styles.subtitle}>Join us and explore the exciting features we offer.</Text>
        
        <CustomButton
          title="Get Started"
          onPress={() => router.push('/signup')}
          style={styles.button}
          textStyle={styles.buttonText}
        />
        
        <CustomButton
          title="Already have an account? Log In"
          onPress={() => router.push('/login')}
          style={styles.linkButton}
          textStyle={styles.linkButtonText}
        />
      </View>
    </LinearGradient>
  );
};

// Reusable Button Component
const CustomButton: React.FC<{ title: string; onPress: () => void; style: any; textStyle: any }> = ({
  title,
  onPress,
  style,
  textStyle,
}) => (
  <TouchableOpacity style={style} onPress={onPress}>
    <Text style={textStyle}>{title}</Text>
  </TouchableOpacity>
);

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 10,
  },
  linkButtonText: {
    color: COLORS.white,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default Welcome;
