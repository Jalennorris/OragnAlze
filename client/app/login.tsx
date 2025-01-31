import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Animated, Easing } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

type Credentials = {
  username: string;
  password: string;
};

const Login: React.FC = () => {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>('');
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'neural-cortex-444613-n3', // Replace with your actual client ID
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log('Google Authentication Successful: ', authentication);
      // Handle successful login with Google
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

  const handleLogin = useCallback(async () => {
    if (!credentials.username || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', credentials);
      console.log('Successfully logged in:', response.data);
      localStorage.setItem('userId', response.data.user_id);
      
      localStorage.setItem('username', response.data.username);
      setLoading(false);
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please check your credentials and try again.');
      setLoading(false);
    }
  }, [credentials, router]);

  const handleChange = useCallback((name: keyof Credentials, value: string) => {
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
        <Text style={styles.title}>Hey,{"\n"}Welcome{"\n"}Back.</Text>

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
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            style={styles.input}
            value={credentials.password}
            onChangeText={(text) => handleChange('password', text)}
            accessibilityLabel="Password input"
          />
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleLogin} accessibilityRole="button">
              <Text style={styles.buttonText}>Log In</Text>
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
          <Text style={styles.googleButtonText}>Login with Google</Text>
        </TouchableOpacity>

        <Text style={styles.text}>
          Don't have an account?{' '}
          <Text style={styles.linkText} onPress={() => router.push('/signup')} accessibilityRole="link">
            Sign Up
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
    top: -200,
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

export default Login;