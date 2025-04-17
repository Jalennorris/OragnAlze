import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const motivationalQuotes = [
    {
        quote: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
    },
    {
        quote: "The future depends on what you do today.",
        author: "Mahatma Gandhi"
    },
    {
        quote: "Your time is limited, so don't waste it living someone else's life.",
        author: "Steve Jobs"
    },
    {
        quote: "The best way to predict the future is to invent it.",
        author: "Alan Kay"
    },
    {
        quote: "The journey of a thousand miles begins with one step.",
        author: "Lao Tzu"
    }
];

const MotivationalQuotes: React.FC = () => {
    const [quote, setQuote] = useState(motivationalQuotes[0]);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        setQuote(motivationalQuotes[randomIndex]);
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.quoteText}>"{quote.quote}"</Text>
            <Text style={styles.authorText}>- {quote.author}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        paddingHorizontal: 20,
    },
    quoteText: {
        fontSize: 18,
        fontStyle: 'italic',
        textAlign: 'center',
        color: '#555',
        marginBottom: 10,
    },
    authorText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#888',
    },
});

export default MotivationalQuotes;