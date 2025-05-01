import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Quote {
  quote: string;
  author: string;
}

const motivationalQuotes: Quote[] = [
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
  },
  {
    quote: "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    quote: "Act as if what you do makes a difference. It does.",
    author: "William James"
  },
  {
    quote: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar"
  },
  {
    quote: "It always seems impossible until it’s done.",
    author: "Nelson Mandela"
  },
  {
    quote: "Don’t watch the clock; do what it does. Keep going.",
    author: "Sam Levenson"
  },
  {
    quote: "Keep your face always toward the sunshine—and shadows will fall behind you.",
    author: "Walt Whitman"
  },
  {
    quote: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt"
  },
  {
    quote: "The purpose of our lives is to be happy.",
    author: "Dalai Lama"
  },
  {
    quote: "Life is what happens when you’re busy making other plans.",
    author: "John Lennon"
  },
  {
    quote: "Get busy living or get busy dying.",
    author: "Stephen King"
  },
  {
    quote: "You only live once, but if you do it right, once is enough.",
    author: "Mae West"
  },
  {
    quote: "Many of life’s failures are people who did not realize how close they were to success when they gave up.",
    author: "Thomas A. Edison"
  },
  {
    quote: "If you want to live a happy life, tie it to a goal, not to people or things.",
    author: "Albert Einstein"
  },
  {
    quote: "Never let the fear of striking out keep you from playing the game.",
    author: "Babe Ruth"
  },
  {
    quote: "Money and success don’t change people; they merely amplify what is already there.",
    author: "Will Smith"
  },
  {
    quote: "Your time is limited, so don’t waste it living someone else’s life.",
    author: "Steve Jobs"
  },
  {
    quote: "Not how long, but how well you have lived is the main thing.",
    author: "Seneca"
  },
  {
    quote: "If life were predictable it would cease to be life, and be without flavor.",
    author: "Eleanor Roosevelt"
  },
  {
    quote: "The whole secret of a successful life is to find out what is one’s destiny to do, and then do it.",
    author: "Henry Ford"
  }
];

const MotivationalQuotes: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState<Quote>(motivationalQuotes[0]);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  const getRandomQuote = (): Quote => {
    const currentIndex = motivationalQuotes.findIndex(q => q.quote === currentQuote.quote);
    let randomIndex;
    
    // Ensure we don't show the same quote twice in a row
    do {
      randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    } while (randomIndex === currentIndex && motivationalQuotes.length > 1);
    
    return motivationalQuotes[randomIndex];
  };

  const animateQuoteChange = () => {
    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Change quote after fade out
      setCurrentQuote(getRandomQuote());
      
      // Slide animation for new quote
      slideAnim.setValue(20);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${currentQuote.quote}" - ${currentQuote.author}`,
      });
    } catch (error) {
      console.error('Error sharing quote:', error);
    }
  };

  useEffect(() => {
    // Set initial random quote
    setCurrentQuote(getRandomQuote());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.quoteContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.quoteText}>"{currentQuote.quote}"</Text>
        <Text style={styles.authorText}>— {currentQuote.author}</Text>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={animateQuoteChange}
          accessibilityLabel="Get new motivational quote"
        >
          <Icon name="refresh" size={24} color="#4a6ea9" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleShare}
          accessibilityLabel="Share this quote"
        >
          <Icon name="share" size={24} color="#4a6ea9" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20, // Reduced margin
    paddingHorizontal: 20, // Reduced padding
  },
  quoteContainer: {
    alignItems: 'center',
    marginBottom: 15, // Reduced margin
  },
  quoteText: {
    fontSize: 16, // Reduced font size
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#333',
    marginBottom: 6, // Reduced margin
    lineHeight: 22, // Adjusted line height
  },
  authorText: {
    fontSize: 14, // Reduced font size
    textAlign: 'center',
    color: '#4a6ea9',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15, // Reduced gap
  },
  button: {
    padding: 8, // Reduced padding
    borderRadius: 40, // Adjusted radius
    backgroundColor: '#f0f4ff',
  },
});

export default MotivationalQuotes;