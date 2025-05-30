import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Share, Modal, TextInput, Platform, PanResponder, useColorScheme
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type QuoteType = 'all' | 'productivity' | 'health' | 'inspiration';
interface Quote { quote: string; author: string; type: QuoteType; }

const quotes: Quote[] = [
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

const OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Productivity', value: 'productivity' },
  { label: 'Health', value: 'health' },
  { label: 'Inspiration', value: 'inspiration' },
];

const FAVORITES_KEY = 'motivational_quotes_favorites';

const MotivationalQuotes: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  // State
  const [type, setType] = useState<QuoteType>('all');
  const [q, setQ] = useState<Quote>(quotes[0]);
  const [fade] = useState(new Animated.Value(1));
  const [slide] = useState(new Animated.Value(0));
  const [modal, setModal] = useState(false);
  const [modalAnim] = useState(new Animated.Value(0));
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Quote[]>([]);
  const [showFav, setShowFav] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Memoized filtered quotes
  const filtered = useMemo(() => {
    let arr = type === 'all' ? quotes : quotes.filter(q => q.type === type);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter(q => q.quote.toLowerCase().includes(s) || q.author.toLowerCase().includes(s));
    }
    if (showFav) arr = arr.filter(q => favorites.some(f => f.quote === q.quote && f.author === q.author));
    return arr;
  }, [type, search, showFav, favorites]);

  // Get random quote
  const getRandom = (): Quote => {
    if (!filtered.length) return q;
    let idx, cur = filtered.findIndex(x => x.quote === q.quote);
    do { idx = Math.floor(Math.random() * filtered.length); } while (idx === cur && filtered.length > 1);
    return filtered[idx];
  };

  // Animate quote change
  const animate = () => {
    Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setQ(getRandom());
      slide.setValue(20);
      Animated.timing(slide, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  // Share with feedback
  const share = async () => {
    try {
      await Share.share({ message: `"${q.quote}" - ${q.author}` });
      showToast('Quote shared!');
    } catch {}
  };

  // Toast
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(''), 1800);
  };

  // Modal open/close with fade
  const openModal = () => {
    setModal(true);
    Animated.timing(modalAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };
  const closeModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setModal(false));
  };

  // Debounced filter change
  const debouncedSetType = (val: QuoteType) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => setType(val), 180);
  };

  // Load favorites
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then(data => {
      if (data) setFavorites(JSON.parse(data));
    });
    // eslint-disable-next-line
  }, []);

  // Save favorites
  const saveFavorites = async (arr: Quote[]) => {
    setFavorites(arr);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
  };

  // Toggle favorite
  const isFav = favorites.some(f => f.quote === q.quote && f.author === q.author);
  const toggleFav = () => {
    let arr;
    if (isFav) arr = favorites.filter(f => !(f.quote === q.quote && f.author === q.author));
    else arr = [...favorites, q];
    saveFavorites(arr);
    showToast(isFav ? 'Removed from favorites' : 'Added to favorites');
  };

  // On filter/search/fav change, pick a random quote
  useEffect(() => { setQ(getRandom()); }, [type, search, showFav, favorites]);
  useEffect(() => { setQ(getRandom()); }, []);

  // PanResponder for swipe
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 40) animate(); // right swipe
        else if (g.dx < -40) animate(); // left swipe
      }
    })
  ).current;

  // Accessibility labels
  const filterLabel = (val: string) => `Filter quotes by ${val}`;

  return (
    <View style={[s.c, { backgroundColor: theme.bg }]}>
      {/* Search and filter row */}
      <View style={s.topRow}>
        <TouchableOpacity
          style={[s.fBtn, { backgroundColor: theme.filterBg }]}
          onPress={openModal}
          accessibilityRole="button"
          accessibilityLabel="Open filter modal"
        >
          <Icon name="filter-list" size={22} color={theme.primary} />
          <Text style={[s.fBtnT, { color: theme.primary }]} allowFontScaling>
            {OPTIONS.find(o => o.value === type)?.label || 'All'}
          </Text>
          <Icon name="arrow-drop-down" size={22} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.favBtn, isFav && { backgroundColor: theme.primary }]}
          onPress={toggleFav}
          accessibilityRole="button"
          accessibilityLabel={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Icon name={isFav ? "favorite" : "favorite-border"} size={22} color={isFav ? "#fff" : theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.favBtn, showFav && { backgroundColor: theme.primary }]}
          onPress={() => setShowFav(f => !f)}
          accessibilityRole="button"
          accessibilityLabel={showFav ? "Show all quotes" : "Show favorite quotes"}
        >
          <Icon name="star" size={22} color={showFav ? "#fff" : theme.primary} />
        </TouchableOpacity>
      </View>
      <TextInput
        style={[s.search, { backgroundColor: theme.inputBg, color: theme.text }]}
        placeholder="Search quotes..."
        placeholderTextColor={theme.placeholder}
        value={search}
        onChangeText={setSearch}
        accessibilityLabel="Search quotes"
        allowFontScaling
      />
      {/* Modal with fade */}
      <Modal visible={modal} transparent animationType="none" onRequestClose={closeModal}>
        <Animated.View style={[s.mO, { opacity: modalAnim }]}>
          <TouchableOpacity style={s.mO} activeOpacity={1} onPressOut={closeModal} accessibilityRole="button" accessibilityLabel="Close filter modal">
            <Animated.View style={[s.mC, { backgroundColor: theme.card }]}>
              <Text style={[s.mT, { color: theme.primary }]} allowFontScaling>Select Quote Type</Text>
              {OPTIONS.map(o => (
                <TouchableOpacity
                  key={o.value}
                  style={[
                    s.mOpt,
                    type === o.value && [s.mOptA, { borderColor: theme.primary, borderWidth: 2 }]
                  ]}
                  onPress={() => { closeModal(); debouncedSetType(o.value as QuoteType); }}
                  accessibilityRole="button"
                  accessibilityLabel={filterLabel(o.label)}
                >
                  <Text style={[
                    s.mOptT,
                    type === o.value && [s.mOptTA, { color: theme.primary }]
                  ]} allowFontScaling>
                    {o.label}
                  </Text>
                  {type === o.value && <Icon name="check" size={20} color={theme.primary} style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              ))}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
      {/* Quote card with swipe */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[s.qC, { opacity: fade, transform: [{ translateY: slide }] }]}
        accessibilityRole="text"
        accessibilityLabel={`Quote: ${q.quote} by ${q.author}`}
      >
        <Text style={[s.qT, { color: theme.text }]} allowFontScaling>"{q.quote}"</Text>
        <Text style={[s.aT, { color: theme.primary }]} allowFontScaling>— {q.author}</Text>
      </Animated.View>
      {/* Buttons */}
      <View style={s.bC}>
        <TouchableOpacity
          style={s.b}
          onPress={animate}
          accessibilityRole="button"
          accessibilityLabel="Show another quote"
        >
          <Icon name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.b}
          onPress={share}
          accessibilityRole="button"
          accessibilityLabel="Share this quote"
        >
          <Icon name="share" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>
      {/* Toast */}
      {toast ? (
        <View style={s.toast}>
          <Text style={s.toastT} allowFontScaling>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
};

// Light/Dark theme
const lightTheme = {
  bg: '#fff',
  card: '#fff',
  text: '#222',
  primary: '#4a6ea9',
  filterBg: '#eaf0fa',
  inputBg: '#f0f4ff',
  placeholder: '#888'
};
const darkTheme = {
  bg: '#181c22',
  card: '#23272f',
  text: '#f0f4ff',
  primary: '#8bb4ff',
  filterBg: '#23272f',
  inputBg: '#23272f',
  placeholder: '#888'
};

const s = StyleSheet.create({
  c: { alignItems: 'center', justifyContent: 'center', marginVertical: 20, paddingHorizontal: 20, flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, alignSelf: 'stretch' },
  fBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 18, alignSelf: 'flex-start', marginRight: 8, marginBottom: 0, shadowColor: '#4a6ea9', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  fBtnT: { fontWeight: 'bold', fontSize: 15, marginHorizontal: 6 },
  favBtn: { padding: 8, borderRadius: 24, marginRight: 8, backgroundColor: 'transparent' },
  search: { borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16, fontSize: 15, marginBottom: 12, alignSelf: 'stretch' },
  mO: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  mC: { borderRadius: 18, padding: 24, width: 260, alignItems: 'stretch', elevation: 8 },
  mT: { fontSize: 17, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  mOpt: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4 },
  mOptA: { backgroundColor: '#eaf0fa' },
  mOptT: { fontSize: 15, fontWeight: '500' },
  mOptTA: { fontWeight: 'bold' },
  qC: { alignItems: 'center', marginBottom: 15, minHeight: 90, paddingHorizontal: 10 },
  qT: { fontSize: 16, fontStyle: 'italic', textAlign: 'center', marginBottom: 6, lineHeight: 22 },
  aT: { fontSize: 14, textAlign: 'center', fontWeight: '500' },
  bC: { flexDirection: 'row', justifyContent: 'center', gap: 15 },
  b: { padding: 8, borderRadius: 40, backgroundColor: '#f0f4ff', marginHorizontal: 5 },
  toast: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  toastT: { backgroundColor: '#222c', color: '#fff', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, fontSize: 15, overflow: 'hidden' }
});

export default MotivationalQuotes;