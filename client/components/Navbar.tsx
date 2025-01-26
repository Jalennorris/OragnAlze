import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // import useRouter correctly

const NavBar: React.FC = () => {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    router.push(screen);
  };

  return (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={() => handleNavigate('/')} style={styles.navItem}>
        <Ionicons name="home-outline" size={30} color="black" />
      
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigate('/addTaskScreen')} style={styles.navItem}>
        <Ionicons name="add-circle-outline" size={30} color="black" />
    
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigate('/calendarScreen')} style={styles.navItem}>
        <Ionicons name="calendar-outline" size={30} color="black" />
       
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
        height: 70,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // For Android shadow effect
      },
      navItem: {
        alignItems: 'center',
        padding: 10,
      
      },
      navText: {
        fontSize: 14,
        color: 'black',
        marginTop: 4,
      },
});