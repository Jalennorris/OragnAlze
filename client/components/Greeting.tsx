import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Greeting: React.FC = () => {
    const [displayName, setDisplayName] = useState<string>('');
    const [greeting, setGreeting] = useState<string>('');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [loading, setIsLoading] = useState<boolean>(false);

    const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in animation
    const scaleAnim = useRef(new Animated.Value(0.8)).current; // For scale animation

    useEffect(() => {
        const loadDisplayName = async () => {
            const storedDisplayName = await AsyncStorage.getItem('displayName');
            if (storedDisplayName) {
                setDisplayName(storedDisplayName);
                handleGreeting(storedDisplayName);
            }
        };

        loadDisplayName();

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
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) return;

            await axios.patch(`http://localhost:8080/api/users/${userId}`, {
                display_name: displayName,
            });

            await AsyncStorage.setItem('displayName', displayName);
            handleGreeting(displayName);
        } catch (error) {
            console.error('Error saving display name:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGreeting = (name: string) => {
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            setGreeting(`Good Morning, ${name}! 🌞`);
        } else if (currentHour < 18) {
            setGreeting(`Good Afternoon, ${name}! 🌤️`);
        } else {
            setGreeting(`Good Evening, ${name}! 🌙`);
        }
    };

    const handleEditDisplayName = async () => {
        if (isEditing) {
            await handleSave();
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
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoFocus
                        placeholder="Enter your name"
                        placeholderTextColor="#999"
                    />
                ) : null}
                <TouchableOpacity onPress={handleEditDisplayName} style={styles.editButton}>
                    {loading ? (
                        <ActivityIndicator color="#333" />
                    ) : (
                        <Ionicons name={isEditing ? 'checkmark-circle' : 'pencil'} size={24} color="#333" />
                    )}
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