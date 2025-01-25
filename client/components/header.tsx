import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';

const loadFonts = () => {
  return Font.loadAsync({
    'GreatVibes-Regular': require('../assets/fonts/GreatVibes-Regular.ttf'),
  });
};

const Header: React.FC = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFonts().then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.logo}>OrganAIze</Text>
      <Ionicons style={styles.icon} name="person-circle-outline" size={30} color="black" />
    </View>
  );
}

export default Header;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "white",
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 35,
    color: 'black',
    fontFamily: 'GreatVibes-Regular',
    fontWeight: 'bold',
  },
  icon: {
    color: 'black',
  },
});