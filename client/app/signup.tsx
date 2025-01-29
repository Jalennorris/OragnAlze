import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';

type SignupCredentials = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const Signup: React.FC = () => {
  const router = useRouter();
  const [credentials, setCredentials] = useState<SignupCredentials>({
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
      router.push('/'); // Redirect to home or dashboard after signup
    } catch (error) {
      console.error('Google Sign-Up failed:', error);
      setError('Google Sign-Up failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSignup = useCallback(async () => {
    const { username, email, password, confirmPassword } = credentials;

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/users/signup', {
        username,
        email,
        password,
      });
      console.log('Successfully signed up:', response.data);
      setLoading(false);
      router.push('/'); // Redirect to home or login page after signup
    } catch (error) {
      console.error('Signup failed:', error);
      setError('Signup failed. Please try again.');
      setLoading(false);
    }
  }, [credentials, router]);

  const handleChange = useCallback((name: keyof SignupCredentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [name]: value }));
  }, []);

  return (
    <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Ionicons
          name="arrow-back"
          size={30}
          color="white"
          onPress={() => router.push('/welcome')}
          style={styles.backButton}
        />
        <Text style={styles.title}>Create{"\n"}Your{"\n"}Account.</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Username"
            placeholderTextColor="#999"
            style={styles.input}
            value={credentials.username}
            onChangeText={(text) => handleChange('username', text)}
            accessibilityLabel="Username input"
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            style={styles.input}
            value={credentials.email}
            onChangeText={(text) => handleChange('email', text)}
            keyboardType="email-address"
            accessibilityLabel="Email input"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            style={styles.input}
            value={credentials.password}
            onChangeText={(text) => handleChange('password', text)}
            accessibilityLabel="Password input"
          />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
            style={styles.input}
            value={credentials.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            accessibilityLabel="Confirm Password input"
          />
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleSignup} accessibilityRole="button">
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.text}>or continue with</Text>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
          disabled={!request}
          accessibilityRole="button"
        >
          <Ionicons name="logo-google" size={24} color="#fff" />
          <Text style={styles.googleButtonText}>Sign Up with Google</Text>
        </TouchableOpacity>

        <Text style={styles.text}>
          Already have an account?{' '}
          <Text style={styles.linkText} onPress={() => router.push('/login')} accessibilityRole="link">
            Log In
          </Text>
        </Text>
      </Animated.View>
    </LinearGradient>
  );
};

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
  backButton: {
    position: 'absolute',
    top: -125,
    left: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#fff',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#6a11cb',
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  linkText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 10,
    fontSize: 16,
  },
});

export default Signup;