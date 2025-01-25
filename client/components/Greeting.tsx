import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Greeting: React.FC = () => {
    const [greeting, setGreeting] = useState<string>('');
    const [username, setUsername] = useState<string>('Jalen');

    useEffect(() => {
        handleGreeting(username);
    }, [username]);

    const handleGreeting = (username: string) => {
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            setGreeting(`Good Morning, ${username}!`);
        } else if (currentHour >= 12 && currentHour < 18) {
            setGreeting(`Good Afternoon, ${username}!`);
        } else if (currentHour >= 18 && currentHour < 24) {
            setGreeting(`Good Evening, ${username}!`);
        } else {
            setGreeting(`Hi, ${username}!`);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.greeting}>{greeting}</Text>
        </View>
    );
};

export default Greeting;

const styles = StyleSheet.create({
    container: {
 
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        padding: 40,
    },
    greeting: {
        fontFamily: "Roboto",
        
        fontSize: 30,
        fontWeight: 'bold',
    },
});