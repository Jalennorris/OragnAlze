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
      navigation.navigate('/'); // Redirect to home or login page after signup
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}
      >
        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.container}>
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Ionicons
              name="arrow-back"
              size={28}
              color={COLORS.primary}
              onPress={() => navigation.navigate('welcome')}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityHint="Go back to welcome screen"
            />
            <Text style={styles.title}>Create Your Account</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="First Name"
                placeholderTextColor="#b0b0b0"
                style={styles.input}
                value={credentials.firstname}
                onChangeText={(text) => handleChange('firstname', text)}
                accessibilityLabel="First Name input"
                accessibilityHint="Enter your first name"
                returnKeyType="next"
              />
              <TextInput
                placeholder="Last Name"
                placeholderTextColor="#b0b0b0"
                style={styles.input}
                value={credentials.lastname}
                onChangeText={(text) => handleChange('lastname', text)}
                accessibilityLabel="Last Name input"
                accessibilityHint="Enter your last name"
                returnKeyType="next"
              />
              <TextInput
                placeholder="Username"
                placeholderTextColor="#b0b0b0"
                style={styles.input}
                value={credentials.username}
                onChangeText={(text) => handleChange('username', text)}
                accessibilityLabel="Username input"
                accessibilityHint="Choose a username"
                returnKeyType="next"
                autoCapitalize="none"
              />
              <TextInput
                placeholder="Email"
                placeholderTextColor="#b0b0b0"
                style={styles.input}
                value={credentials.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
                accessibilityLabel="Email input"
                accessibilityHint="Enter your email address"
                returnKeyType="next"
                autoCapitalize="none"
              />
              <View style={styles.passwordRow}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#b0b0b0"
                  secureTextEntry={!showPassword}
                  style={[styles.input, { flex: 1 }]}
                  value={credentials.password}
                  onChangeText={(text) => handleChange('password', text)}
                  accessibilityLabel="Password input"
                  accessibilityHint="Enter your password"
                  returnKeyType="next"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeIcon}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordRow}>
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#b0b0b0"
                  secureTextEntry={!showConfirmPassword}
                  style={[styles.input, { flex: 1 }]}
                  value={credentials.confirmPassword}
                  onChangeText={(text) => handleChange('confirmPassword', text)}
                  accessibilityLabel="Confirm Password input"
                  accessibilityHint="Re-enter your password"
                  returnKeyType="done"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.eyeIcon}
                  accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 6 }} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignup}
                accessibilityRole="button"
                accessibilityHint="Sign up for a new account"
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!request}
              accessibilityRole="button"
              accessibilityHint="Sign up with your Google account"
              activeOpacity={0.85}
            >
              <Ionicons name="logo-google" size={22} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.googleButtonText}>Sign Up with Google</Text>
            </TouchableOpacity>
            <Text style={styles.text}>
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
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  card: {
    width: '92%',
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginBottom: 18,
  },
  backButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 2,
    backgroundColor: '#f2f2f2',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 18,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
    letterSpacing: 0.2,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  input: {
    height: 48,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#f7f8fa',
    color: COLORS.textDark,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 2,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    transitionDuration: '200ms',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#b0b0b0',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 18,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#4285F4',
    shadowOpacity: 0.13,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  googleButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  text: {
    color: COLORS.primary,
    marginTop: 2,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
    textAlign: 'center',
  },
  linkText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeaea',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 10,
    marginTop: -4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
});

export default Signup;