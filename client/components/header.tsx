import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

// Load custom fonts
const loadFonts = async () => {
  await Font.loadAsync({
    "GreatVibes-Regular": require("../assets/fonts/GreatVibes-Regular.ttf"),
  });
};

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const Header: React.FC = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const scaleValue = new Animated.Value(1); // For icon animation

  useEffect(() => {
    const prepare = async () => {
      try {
        await loadFonts();
      } catch (error) {
        console.warn(error);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded
      }
    };

    prepare();
  }, []);

  const handleProfilePress = () => {
    console.log("Profile icon pressed");
    // Add a subtle animation on press
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
    ]).start();
  };

  if (!fontsLoaded) {
    return null; // Return null or a custom loading indicator
  }

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.logo}>OrganAIze</Text>
      <Pressable onPress={handleProfilePress}>
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <Ionicons name="person-circle-outline" size={30} color="#333" />
        </Animated.View>
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
    shadowRadius: 6,
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
});