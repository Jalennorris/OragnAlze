import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Animated, Easing } from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          <Text style={styles.title}>Create{"\n"}Your{"\n"}Account.</Text>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="First Name"
              placeholderTextColor="#999"
              style={styles.input}
              value={credentials.firstname}
              onChangeText={(text) => handleChange('firstname', text)}
              accessibilityLabel="First Name input"
            />
            <TextInput
              placeholder="Last Name"
              placeholderTextColor="#999"
              style={styles.input}
              value={credentials.lastname}
              onChangeText={(text) => handleChange('lastname', text)}
              accessibilityLabel="Last Name input"
            />
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
            <Text style={styles.linkText} onPress={() => navigation.navigate('login')} accessibilityRole="link">
              Log In
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

export default Signup;