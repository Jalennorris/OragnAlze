import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // import useRouter correctly

const NavBar: React.FC = () => {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={() => handleNavigate('/')} style={styles.navItem}>
        <Ionicons name="home-outline" size={24} color="black" />
        <Text style={styles.navText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigate('/addTaskScreen')} style={styles.navItem}>
        <Ionicons name="add-circle-outline" size={24} color="black" />
        <Text style={styles.navText}>Add Task</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigate('/calendarScreen')} style={styles.navItem}>
        <Ionicons name="calendar-outline" size={24} color="black" />
        <Text style={styles.navText}>Calendar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NavBar;

const styles = StyleSheet.create({
  navBar: {
    
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingTop: 10,
    paddingBottom: 10,
    borderTopColor: '#ccc',
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 16,
  },
});