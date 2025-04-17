import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Credentials = {
  username: string;
  password: string;
};

const Login: React.FC = () => {
  const navigation = useNavigation();
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

      // Store user data in AsyncStorage
      await AsyncStorage.setItem('userId', response.data.userId.toString());
      await AsyncStorage.setItem('username', response.data.username);
      await AsyncStorage.setItem('firstname', response.data.firstname);
      await AsyncStorage.setItem('lastname', response.data.lastname);
      await AsyncStorage.setItem('email', response.data.email);
      await AsyncStorage.setItem('token', response.data.token);

      console.log('User data successfully stored in AsyncStorage.');

      setLoading(false);
      navigation.navigate('index');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please check your credentials and try again.');
      setLoading(false);
    }
  }, [credentials, navigation]);

  const handleChange = useCallback((name: keyof Credentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [name]: value }));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Ionicons
            name="arrow-back"
            size={30}
            color="white"
            onPress={() => navigation.navigate('welcome')}
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
            <Text style={styles.linkText} onPress={() => navigation.navigate('signup')} accessibilityRole="link">
              Sign Up
            </Text>
          </Text>
        </Animated.View>
      </LinearGradient>
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
});

export default Login;