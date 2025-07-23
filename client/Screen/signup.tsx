import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecureStore from 'expo-secure-store';

const COLORS = {
  primary: '#6a11cb',
  secondary: '#2575fc',
  accent: '#ffb347',
  white: '#fff',
  glass: 'rgba(255,255,255,0.18)',
  border: 'rgba(255,255,255,0.25)',
  error: '#ff6b6b',
  textDark: '#22223b',
};

type SignupCredentials = {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const Signup: React.FC = () => {
  const navigation = useNavigation();
  const [credentials, setCredentials] = useState<SignupCredentials>({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual Google Client ID
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log('Google Authentication Successful: ', authentication);
      // Handle successful signup with Google
      handleGoogleSignUp(authentication?.accessToken);
    }
  }, [response]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleGoogleSignUp = async (token: string | undefined) => {
    if (!token) {
      setError('Google Sign-In failed. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Send the Google token to your backend for user creation
      const response = await axios.post('http://localhost:8080/api/users/google-signup', {
        token,
      });
      console.log('Successfully signed up with Google:', response.data);
      setLoading(false);
      navigation.navigate('/'); // Redirect to home or dashboard after signup
    } catch (error) {
      console.error('Google Sign-Up failed:', error);
      setError('Google Sign-Up failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSignup = useCallback(async () => {
    const { firstname, lastname, username, email, password, confirmPassword } = credentials;

    // Basic validation
    if (!firstname || !lastname || !username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', {
        firstname,
        lastname,
        username,
        email,
        password,
        role: 'USER',
      });
      
      console.log('Successfully signed up:', response.data);
      setLoading(false);
      navigation.navigate('login'); // Redirect to home or login page after signup
    } catch (error) {
      console.error('Signup failed:', error);
      setError('Signup failed. Please try again.');
      setLoading(false);
    }
  }, [credentials, navigation]);

  const handleChange = useCallback((name: keyof SignupCredentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradient}>
        <KeyboardAvoidingView
          style={{ flex: 1, width: '100%' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={60}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('welcome')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Navigates to the welcome screen"
          >
            <Ionicons name="arrow-back" size={28} color={COLORS.white} />
          </TouchableOpacity>
          {/* Logo/Title Section */}
          <View style={styles.logoContainer}>
            <Ionicons name="rocket-outline" size={40} color={COLORS.white} style={{ marginBottom: 8 }} />
            <Text style={styles.brandTitle}>OrganAIze</Text>
          </View>
          {/* Card */}
          <Animated.View style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            <Text style={styles.title}>Create Your Account</Text>
            <View style={styles.inputContainer}>
              {/* First Name */}
              <TextInput
                placeholder="First Name"
                placeholderTextColor="#bbb"
                style={styles.input}
                value={credentials.firstname}
                onChangeText={(text) => handleChange('firstname', text)}
                accessibilityLabel="First Name input"
                returnKeyType="next"
              />
              {/* Last Name */}
              <TextInput
                placeholder="Last Name"
                placeholderTextColor="#bbb"
                style={styles.input}
                value={credentials.lastname}
                onChangeText={(text) => handleChange('lastname', text)}
                accessibilityLabel="Last Name input"
                returnKeyType="next"
              />
              {/* Username */}
              <TextInput
                placeholder="Username"
                placeholderTextColor="#bbb"
                style={styles.input}
                value={credentials.username}
                onChangeText={(text) => handleChange('username', text)}
                accessibilityLabel="Username input"
                autoCapitalize="none"
                returnKeyType="next"
              />
              {/* Email */}
              <TextInput
                placeholder="Email"
                placeholderTextColor="#bbb"
                style={styles.input}
                value={credentials.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
                accessibilityLabel="Email input"
                autoCapitalize="none"
                returnKeyType="next"
              />
              {/* Password */}
              <View style={{ position: 'relative' }}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#bbb"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  value={credentials.password}
                  onChangeText={(text) => handleChange('password', text)}
                  accessibilityLabel="Password input"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword((prev) => !prev)}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {/* Confirm Password */}
              <View style={{ position: 'relative' }}>
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#bbb"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                  value={credentials.confirmPassword}
                  onChangeText={(text) => handleChange('confirmPassword', text)}
                  accessibilityLabel="Confirm Password input"
                  autoCapitalize="none"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {/* Error */}
              {error && (
                <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text>
              )}
              {/* Sign Up Button */}
              {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} accessibilityLabel="Loading" style={{ marginTop: 10 }} />
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSignup}
                  accessibilityRole="button"
                  accessibilityLabel="Sign Up"
                  accessibilityHint="Sign up for a new account"
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Divider */}
            <Text style={styles.orText}>or continue with</Text>
            {/* Google Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!request || loading}
              accessibilityRole="button"
              accessibilityLabel="Sign Up with Google"
              accessibilityHint="Sign up with your Google account"
            >
              <Ionicons name="logo-google" size={22} color={COLORS.primary} />
              <Text style={styles.googleButtonText}>Sign Up with Google</Text>
            </TouchableOpacity>
            {/* Login Link */}
            <Text style={styles.signupText}>
              Already have an account?{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('login')}
                accessibilityRole="link"
                accessibilityHint="Go to login screen"
              >
                Log In
              </Text>
            </Text>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 90,
    marginBottom: 18,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  card: {
    width: '92%',
    alignSelf: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    padding: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 1,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  input: {
    height: 44,
    borderColor: COLORS.primary,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    color: COLORS.textDark,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 10,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginTop: 2,
    marginBottom: 18,
    alignSelf: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  signupText: {
    color: COLORS.textDark,
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: COLORS.error,
    marginTop: 2,
    marginBottom: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
    zIndex: 1,
  },
});

export default Signup;