import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import axios from "axios";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Load custom fonts
const loadFonts = async () => {
  await Font.loadAsync({
    "GreatVibes-Regular": require("../assets/fonts/GreatVibes-Regular.ttf"),
  });
};

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const SIZES = {
  padding: 20,
  borderRadius: 10,
  iconSize: 24,
  profileImageSize: 120,
  colorBlockSize: 100,
};

const colorBlocks = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#F1C40F', '#8E44AD'];

interface Credentials {
  profile_pic: string;
}

const Header: React.FC = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();
  const [credentials, setCredentials] = useState<Credentials>({ profile_pic: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const prepare = async () => {
      try {
        await loadFonts();
      } catch (error) {
        console.warn(error);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    };
    prepare();
  }, []);

  const fetchUserInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setError('No userId found in storage');
        setLoading(false);
        return;
      }
      const response = await axios.get(`http://localhost:8080/api/users/${userId}`);
      const data = response.data;
      setCredentials({ profile_pic: data.profile_pic });
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch user info');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo, retryCount]);

  const handleRetry = () => setRetryCount((c) => c + 1);

  const handleProfilePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate("settings");
    });
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#333" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "red" }} allowFontScaling>
          {error}
        </Text>
        <Pressable onPress={handleRetry} accessibilityLabel="Retry loading profile" accessibilityRole="button">
          <Text style={{ color: "#007AFF", marginTop: 8 }} allowFontScaling>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!credentials.profile_pic) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "red" }} allowFontScaling>
          Failed to load profile picture
        </Text>
        <Pressable onPress={handleRetry} accessibilityLabel="Retry loading profile" accessibilityRole="button">
          <Text style={{ color: "#007AFF", marginTop: 8 }} allowFontScaling>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.logo} allowFontScaling>
        OrganAIze
      </Text>
      <Pressable
        onPress={handleProfilePress}
        accessibilityLabel="Go to profile settings"
        accessibilityRole="button"
      >
        {colorBlocks.includes(credentials.profile_pic) ? (
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <View style={{ backgroundColor: credentials.profile_pic, width: 30, height: 30, borderRadius: 15 }} />
          </Animated.View>
        ) : (
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <Ionicons name="person-circle-outline" size={30} color="#333" />
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomColor: "#e0e0e0",
    borderBottomWidth: 1,
    elevation: 4, // Add shadow for Android
    shadowColor: "#000", // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius:0,
  },
  logo: {
    fontSize: 32, // Slightly larger for emphasis
    color: "#333",
    fontFamily: "GreatVibes-Regular",
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.1)", // Add subtle text shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
});