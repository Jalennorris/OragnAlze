import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator, Platform, Dimensions } from "react-native";
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
  const logoAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
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
        <Text style={styles.errorText} allowFontScaling>
          {error}
        </Text>
        <Pressable
          onPress={handleRetry}
          accessibilityLabel="Retry loading profile"
          accessibilityRole="button"
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText} allowFontScaling>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!credentials.profile_pic) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText} allowFontScaling>
          Failed to load profile picture
        </Text>
        <Pressable
          onPress={handleRetry}
          accessibilityLabel="Retry loading profile"
          accessibilityRole="button"
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText} allowFontScaling>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.headerContainer}>
      <Animated.Text
        style={[
          styles.logo,
          {
            opacity: logoAnim,
            transform: [
              {
                translateY: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
        allowFontScaling
        accessibilityRole="header"
      >
        OrganAIze
      </Animated.Text>
      <Pressable
        onPress={handleProfilePress}
        accessibilityLabel="Go to profile settings"
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.profileButton,
          pressed && styles.profileButtonPressed,
        ]}
      >
        {colorBlocks.includes(credentials.profile_pic) ? (
          <Animated.View
            style={[
              styles.profilePic,
              {
                backgroundColor: credentials.profile_pic,
                transform: [{ scale: scaleValue }],
                shadowColor: credentials.profile_pic,
                shadowOpacity: 0.18,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              },
            ]}
          />
        ) : (
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <Ionicons name="person-circle" size={44} color="#6366f1" style={styles.profileIcon} />
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
};

export default Header;

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 18,
    backgroundColor: "#f8fafc", // solid background color
    borderRadius: 20,
    marginTop: 0,
    marginBottom: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 72,
  },
  logo: {
    fontSize: 30,
    color: "#22223b",
    fontFamily: "GreatVibes-Regular",
    letterSpacing: 2.5,
    textShadowColor: "rgba(34, 34, 59, 0.12)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
    flex: 1,
  },
  loadingContainer: {
    width: "100%",
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderBottomColor: "#e0e7ef",
    borderBottomWidth: 1,
  },
  errorText: {
    color: "#e63946",
    fontSize: 16,
    fontWeight: "500",
  },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f3f4",
    borderRadius: 8,
    alignSelf: "center",
  },
  retryButtonText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 15,
  },
  profileButton: {
    borderRadius: 24,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  profileButtonPressed: {
    opacity: 0.8,
    backgroundColor: "#e0e7ef",
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileIcon: {
    shadowColor: "#6366f1",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});