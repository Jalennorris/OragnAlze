import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const NavBar: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('/');
  const scaleAnim = new Animated.Value(1); // For button press animation

  const handleNavigate = (screen: string) => {
    setActiveTab(screen);
    router.push(screen);

    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getIconColor = (screen: string) => {
    return activeTab === screen ? '#6a11cb' : '#333'; // Active tab color: purple
  };

  return (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={() => handleNavigate('/')} style={styles.navItem}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons name="home-outline" size={30} color={getIconColor('/')} />
          <Text style={[styles.navText, { color: getIconColor('/') }]}>Home</Text>
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigate('/addTaskScreen')} style={styles.navItem}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons name="add-circle-outline" size={30} color={getIconColor('/addTaskScreen')} />
          <Text style={[styles.navText, { color: getIconColor('/addTaskScreen') }]}>Add Task</Text>
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigate('/calendarScreen')} style={styles.navItem}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons name="calendar-outline" size={30} color={getIconColor('/calendarScreen')} />
          <Text style={[styles.navText, { color: getIconColor('/calendarScreen') }]}>Calendar</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default NavBar;

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: 80,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10, // For Android shadow effect
  },
  navItem: {
    alignItems: 'center',
    padding: 10,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});