import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleSignInButton from './AppleSignInButton';
import * as AppleAuthentication from 'expo-apple-authentication';
import {router } from 'expo-router';
import { useAuth } from '@/Provider/AuthProvider';

type Credentials = {
  username: string;
  password: string;
};

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

const Login: React.FC = () => {
  const navigation = useNavigation();
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const {signIn} = useAuth();

  // Animations
  const cardAnim = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // Store sensitive data securely
  const storeUserData = async (data: any) => {
    await AsyncStorage.setItem('userId', data.userId.toString());
    await AsyncStorage.setItem('username', data.username);
    await AsyncStorage.setItem('firstname', data.firstname);
    await AsyncStorage.setItem('lastname', data.lastname);
    await AsyncStorage.setItem('email', data.email);
    await AsyncStorage.setItem('token', data.token);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardAnim, cardOpacity]);

  const handleLogin = useCallback(async () => {
    if (!credentials.username || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', credentials);
      await storeUserData(response.data);
      await signIn(response.data.userId.toString());
      console.log('Login successful:', response.data.userId.toString());
      setLoading(false);
      navigation.replace('index');
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
        'Login failed. Please check your credentials and try again.'
      );
      setLoading(false);
    }
  }, [credentials, navigation]);

  const handleChange = useCallback((name: keyof Credentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }, []);

  const handleAppleLogin = async (credential: AppleAuthentication.AppleAuthenticationCredential) => {
    try {
      // Send credential.identityToken to your backend for verification and login
      const backendResponse = await axios.post('http://localhost:8080/api/auth/apple', {
        token: credential.identityToken,
      });
      await storeUserData(backendResponse.data);
      router.replace('/index');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Apple login failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradient}>
        <KeyboardAvoidingView
          style={{ flex: 1, width: '100%' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={60}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('welcome')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Navigates to the welcome screen"
          >
            <Ionicons name="arrow-back" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Ionicons name="rocket-outline" size={40} color={COLORS.white} style={{ marginBottom: 8 }} />
            <Text style={styles.brandTitle}>OrganAIze</Text>
          </View>
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Welcome Back</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Username"
                placeholderTextColor="#bbb"
                style={styles.input}
                value={credentials.username}
                onChangeText={(text) => handleChange('username', text)}
                accessibilityLabel="Username"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                textContentType="username"
                editable={!loading}
              />
              <View style={{ position: 'relative' }}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#bbb"
                  secureTextEntry={!passwordVisible}
                  style={styles.input}
                  value={credentials.password}
                  onChangeText={(text) => handleChange('password', text)}
                  accessibilityLabel="Password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  textContentType="password"
                  editable={!loading}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setPasswordVisible((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
                  accessibilityHint="Toggles password visibility"
                  disabled={loading}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-off' : 'eye'}
                    size={22}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
              {error && <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text>}
              {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} accessibilityLabel="Loading" style={{ marginTop: 10 }} />
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleLogin}
                  accessibilityRole="button"
                  accessibilityLabel="Log In"
                  accessibilityHint="Attempts to log you in"
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.orText}>or continue with</Text>
            <AppleSignInButton onLogin={handleAppleLogin} disabled={loading} />
            <Text style={styles.signupText}>
              Don't have an account?{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('signup')}
                accessibilityRole="link"
                accessibilityLabel="Sign Up"
                accessibilityHint="Navigate to the sign up screen"
              >
                Sign Up
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

export default Login;