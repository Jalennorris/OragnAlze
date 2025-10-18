import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecureStore from 'expo-secure-store';
import AppleSignInButton from './AppleSignInButton';
import * as AppleAuthentication from 'expo-apple-authentication';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

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

  const handleAppleLogin = async (credential: AppleAuthentication.AppleAuthenticationCredential) => {
    try {
      // Send credential.identityToken to your backend for verification and signup
      const backendResponse = await axios.post('http://localhost:8080/api/auth/apple', {
        token: credential.identityToken,
      });
      // Optionally store user data or navigate as needed
      navigation.navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Apple signup failed. Please try again.');
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
          <View style={styles.topContainer}>
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
              <AppleSignInButton onLogin={handleAppleLogin} disabled={loading} />
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
          </View>
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
    alignItems: 'stretch',
  },
  topContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4, // previously 24, now 24 - 20 = 4
  },
  backButton: {
    position: 'absolute',
    top: 10, // previously 0, now moved up by 20px
    left: 24,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 28, // previously 48, now 48 - 20 = 28
    marginBottom: 8,
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
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 18,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textDark,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
    zIndex: 2,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  orText: {
    textAlign: 'center',
    color: COLORS.textDark,
    marginVertical: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  signupText: {
    textAlign: 'center',
    color: COLORS.textDark,
    marginTop: 18,
    fontSize: 15,
  },
  linkText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default Signup;