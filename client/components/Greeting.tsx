import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Greeting: React.FC = () => {
    const userName= localStorage.getItem('username');
    console.log(`Greeting ${userName}`);
    
    const [greeting, setGreeting] = useState<string>('');
    const [username, setUsername] = useState<string>(userName || 'Jalen');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [tempUsername, setTempUsername] = useState<string>('Jalen');
    
    const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in animation
    const scaleAnim = useRef(new Animated.Value(0.8)).current; // For scale animation

    useEffect(() => {
        handleGreeting(username);
        // Fade-in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
        // Scale animation
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.elastic(1.2),
            useNativeDriver: true,
        }).start();
    }, [username]);

    const handleGreeting = (username: string) => {
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            setGreeting(`Good Morning, ${username}! 🌞`);
        } else if (currentHour >= 12 && currentHour < 18) {
            setGreeting(`Good Afternoon, ${username}! 🌤️`);
        } else if (currentHour >= 18 && currentHour < 24) {
            setGreeting(`Good Evening, ${username}! 🌙`);
        } else {
            setGreeting(`Hi, ${username}! 👋`);
        }
    };

    const handleEditUsername = () => {
        if (isEditing) {
            setUsername(tempUsername);
        }
        setIsEditing(!isEditing);
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.greeting}>{greeting}</Text>
            <View style={styles.editContainer}>
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={tempUsername}
                        onChangeText={setTempUsername}
                        autoFocus
                        placeholder="Enter your name"
                        placeholderTextColor="#999"
                    />
                ) : null}
                <TouchableOpacity onPress={handleEditUsername} style={styles.editButton}>
                    <Ionicons name={isEditing ? 'checkmark-circle' : 'pencil'} size={24} color="#333" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

export default Greeting;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        margin: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    greeting: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    editContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
        color: '#333',
        marginRight: 10,
        width: 150,
    },
    editButton: {
        padding: 10,
        backgroundColor: '#e9ecef',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
});