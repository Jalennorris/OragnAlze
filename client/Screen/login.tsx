import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
// Use AsyncStorage for sensitive data
import AsyncStorage from '@react-native-async-storage/async-storage';

type Credentials = {
  username: string;
  password: string;
};

const Login: React.FC = () => {
  const navigation = useNavigation();
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Replace with your actual Google OAuth client ID
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '964543696153-o2t3m0bedk6o1aqe5puscq51f33fq89t.apps.googleusercontent.com',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

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
    const handleGoogleLogin = async () => {
      if (response?.type === 'success' && response.authentication?.accessToken) {
        try {
          // Send token to backend for verification and login/signup
          const backendResponse = await axios.post('http://localhost:8080/api/auth/google', {
            token: response.authentication.accessToken,
          });

          await storeUserData(backendResponse.data);

          navigation.navigate('index');
        } catch (err: any) {
          setError(
            err?.response?.data?.message ||
            'Google login failed. Please try again.'
          );
        }
      }
    };
    handleGoogleLogin();
  }, [response, navigation]);

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

  const handleLogin = useCallback(async () => {
    if (!credentials.username || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', credentials);

      await storeUserData(response.data);

      setLoading(false);
      navigation.navigate('index');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}
      >
        <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Ionicons
              name="arrow-back"
              size={30}
              color="white"
              onPress={() => navigation.navigate('welcome')}
              style={styles.backButton}
              accessibilityLabel="Go back"
              accessibilityHint="Navigates to the welcome screen"
            />
            <Text style={styles.title}>Hey,{"\n"}Welcome{"\n"}Back.</Text>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Username"
                placeholderTextColor="#999"
                style={styles.input}
                value={credentials.username}
                onChangeText={(text) => handleChange('username', text)}
                accessibilityLabel="Username"
                accessibilityHint="Enter your username"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                textContentType="username"
                editable={!loading}
              />
              <View style={{ position: 'relative' }}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!passwordVisible}
                  style={styles.input}
                  value={credentials.password}
                  onChangeText={(text) => handleChange('password', text)}
                  accessibilityLabel="Password"
                  accessibilityHint="Enter your password"
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
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
              {loading ? (
                <ActivityIndicator size="large" color="#fff" accessibilityLabel="Loading" />
              ) : (
                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.6 }]}
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

            {error && <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text>}

            <Text style={styles.text}>or continue with</Text>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!request || loading}
              accessibilityRole="button"
              accessibilityLabel="Login with Google"
              accessibilityHint="Authenticate using your Google account"
            >
              <Ionicons name="logo-google" size={24} color="#fff" />
              <Text style={styles.googleButtonText}>Login with Google</Text>
            </TouchableOpacity>

            <Text style={styles.text}>
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
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6a11cb', // Match the gradient's starting color
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: -100, // Adjusted position
    left: 15, // Adjusted position
  },
  title: {
    fontSize: 28, // Reduced font size
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 20, // Reduced margin
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15, // Reduced margin
  },
  input: {
    height: 40, // Reduced height
    borderColor: '#fff',
    borderWidth: 1,
    marginBottom: 10, // Reduced margin
    paddingHorizontal: 10, // Reduced padding
    borderRadius: 20, // Reduced border radius
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 10, // Reduced padding
    borderRadius: 20, // Reduced border radius
    width: '90%', // Adjusted width
    alignItems: 'center',
  },
  buttonText: {
    color: '#6a11cb',
    fontSize: 16, // Reduced font size
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    marginTop: 15, // Reduced margin
    fontSize: 14, // Reduced font size
  },
  linkText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8, // Reduced padding
    paddingHorizontal: 15, // Reduced padding
    borderRadius: 20, // Reduced border radius
    marginTop: 8, // Reduced margin
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 14, // Reduced font size
    marginLeft: 8, // Reduced margin
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 8, // Reduced margin
    fontSize: 14, // Reduced font size
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 10,
    zIndex: 1,
  },
});

export default Login;