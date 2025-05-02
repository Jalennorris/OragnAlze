import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Share, ScrollView, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// --- Quote Types ---
type QuoteType = 'all' | 'productivity' | 'health' | 'inspiration';

interface Quote {
  quote: string;
  author: string;
  type: QuoteType;
}

// --- Quotes Data ---
const motivationalQuotes: Quote[] = [
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", type: 'productivity' },
  { quote: "The future depends on what you do today.", author: "Mahatma Gandhi", type: 'productivity' },
  { quote: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs", type: 'inspiration' },
  { quote: "The best way to predict the future is to invent it.", author: "Alan Kay", type: 'productivity' },
  { quote: "The journey of a thousand miles begins with one step.", author: "Lao Tzu", type: 'inspiration' },
  { quote: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill", type: 'inspiration' },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", type: 'inspiration' },
  { quote: "Act as if what you do makes a difference. It does.", author: "William James", type: 'inspiration' },
  { quote: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar", type: 'productivity' },
  { quote: "It always seems impossible until it’s done.", author: "Nelson Mandela", type: 'inspiration' },
  { quote: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson", type: 'productivity' },
  { quote: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman", type: 'inspiration' },
  { quote: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", type: 'inspiration' },
  { quote: "The purpose of our lives is to be happy.", author: "Dalai Lama", type: 'health' },
  { quote: "Life is what happens when you’re busy making other plans.", author: "John Lennon", type: 'health' },
  { quote: "Get busy living or get busy dying.", author: "Stephen King", type: 'inspiration' },
  { quote: "You only live once, but if you do it right, once is enough.", author: "Mae West", type: 'health' },
  { quote: "Many of life’s failures are people who did not realize how close they were to success when they gave up.", author: "Thomas A. Edison", type: 'inspiration' },
  { quote: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein", type: 'health' },
  { quote: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth", type: 'inspiration' },
  { quote: "Money and success don’t change people; they merely amplify what is already there.", author: "Will Smith", type: 'productivity' },
  { quote: "Your time is limited, so don’t waste it living someone else’s life.", author: "Steve Jobs", type: 'inspiration' },
  { quote: "Not how long, but how well you have lived is the main thing.", author: "Seneca", type: 'health' },
  { quote: "If life were predictable it would cease to be life, and be without flavor.", author: "Eleanor Roosevelt", type: 'health' },
  { quote: "The whole secret of a successful life is to find out what is one’s destiny to do, and then do it.", author: "Henry Ford", type: 'productivity' }
];

// --- Quote Type Options ---
const QUOTE_TYPE_OPTIONS: { label: string; value: QuoteType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Productivity', value: 'productivity' },
  { label: 'Health', value: 'health' },
  { label: 'Inspiration', value: 'inspiration' },
];

const MotivationalQuotes: React.FC = () => {
  const [quoteType, setQuoteType] = useState<QuoteType>('all');
  const [currentQuote, setCurrentQuote] = useState<Quote>(motivationalQuotes[0]);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filter quotes based on selected type
  const filteredQuotes = quoteType === 'all'
    ? motivationalQuotes
    : motivationalQuotes.filter(q => q.type === quoteType);

  const getRandomQuote = (): Quote => {
    const currentIndex = filteredQuotes.findIndex(q => q.quote === currentQuote.quote);
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    } while (randomIndex === currentIndex && filteredQuotes.length > 1);
    return filteredQuotes[randomIndex];
  };

  const animateQuoteChange = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentQuote(getRandomQuote());
      slideAnim.setValue(20);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
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

  // When quoteType changes, pick a new quote from the filtered set
  useEffect(() => {
    setCurrentQuote(getRandomQuote());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteType]);

  useEffect(() => {
    // Set initial random quote
    setCurrentQuote(getRandomQuote());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {/* Modern Filter Button */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
        accessibilityLabel="Filter motivational quotes"
      >
        <Icon name="filter-list" size={22} color="#4a6ea9" />
        <Text style={styles.filterButtonText}>
          {QUOTE_TYPE_OPTIONS.find(opt => opt.value === quoteType)?.label || 'All'}
        </Text>
        <Icon name="arrow-drop-down" size={22} color="#4a6ea9" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Quote Type</Text>
            {QUOTE_TYPE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  quoteType === option.value && styles.modalOptionActive
                ]}
                onPress={() => {
                  setQuoteType(option.value);
                  setFilterModalVisible(false);
                }}
                accessibilityLabel={`Show ${option.label} quotes`}
                accessibilityState={{ selected: quoteType === option.value }}
              >
                <Text style={[
                  styles.modalOptionText,
                  quoteType === option.value && styles.modalOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {quoteType === option.value && (
                  <Icon name="check" size={20} color="#4a6ea9" style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaf0fa',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginBottom: 12,
    shadowColor: '#4a6ea9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    color: '#4a6ea9',
    fontWeight: 'bold',
    fontSize: 15,
    marginHorizontal: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: 260,
    alignItems: 'stretch',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#4a6ea9',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: '#eaf0fa',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: '#4a6ea9',
    fontWeight: 'bold',
  },
  quoteContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#333',
    marginBottom: 6,
    lineHeight: 22,
  },
  authorText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#4a6ea9',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  button: {
    padding: 8,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
  },
});

export default MotivationalQuotes;