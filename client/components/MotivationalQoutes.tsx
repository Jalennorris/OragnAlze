import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Share, Modal, TextInput, Platform, PanResponder, useColorScheme, FlatList, Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

type QuoteType = 'all' | 'productivity' | 'health' | 'inspiration';
interface Quote { 
  quote: string; 
  author: string; 
  type: QuoteType; 
  id?: number | string; // Add id for backend reference
}

const OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Productivity', value: 'productivity' },
  { label: 'Health', value: 'health' },
  { label: 'Inspiration', value: 'inspiration' },
];

const LIKES_KEY = 'motivational_quotes_likes';
const FAVORITES_KEY = 'motivational_quotes_favorites';

const MotivationalQuotes: React.FC = () => {
  const colorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchDarkMode = async () => {
      try {
        const stored = await AsyncStorage.getItem('darkMode');
        if (stored !== null) {
          setDarkMode(JSON.parse(stored));
        }
      } catch {
        setDarkMode(false);
      }
    };
    fetchDarkMode();
    const interval = setInterval(fetchDarkMode, 1000);
    return () => clearInterval(interval);
  }, []);

  const theme = (darkMode || colorScheme === 'dark') ? darkTheme : lightTheme;

  const [type, setType] = useState<QuoteType>('all');
  const [q, setQ] = useState<Quote | undefined>(undefined);
  const [fade] = useState(new Animated.Value(1));
  const [slide] = useState(new Animated.Value(0));
  const [modal, setModal] = useState(false);
  const [modalAnim] = useState(new Animated.Value(0));
  const [search, setSearch] = useState('');
  const [likes, setLikes] = useState<Quote[]>([]);
  const [favorite, setFavorites] = useState<Quote[]>([]);
  const [showLikes, setShowLikes] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showQuoteDropdown, setShowQuoteDropdown] = useState(false);
  const quoteDropdownAnim = useRef(new Animated.Value(0)).current;
  const [showSearch, setShowSearch] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    })();
  }, []);

  // Utility: normalize string for search (remove diacritics, lowercase)
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Returns the filtered list of quotes based on type, search, and likes
  const filtered = useMemo(() => {
    let arr = type === 'all' ? quotes : quotes.filter(q => q.type === type);
    if (search.trim()) {
      const terms = search.trim().split(/\s+/).map(normalize);
      arr = arr.filter(q => {
        const quoteNorm = normalize(q.quote);
        const authorNorm = normalize(q.author);
        const typeNorm = normalize(q.type);
        // All terms must match in either quote, author, or type
        return terms.every(term =>
          quoteNorm.includes(term) ||
          authorNorm.includes(term) ||
          typeNorm.includes(term)
        );
      });
    }
    if (showLikes) arr = arr.filter(q => likes.some(f => f.quote === q.quote && f.author === q.author));
    return arr;
  }, [type, search, showLikes, likes, quotes]);

  const getRandom = (): Quote | undefined => {
    if (!filtered.length) return undefined;
    let idx, cur = filtered.findIndex(x => q && x.quote === q.quote);
    do { idx = Math.floor(Math.random() * filtered.length); } while (idx === cur && filtered.length > 1);
    return filtered[idx];
  };

  const animate = () => {
    Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setQ(getRandom());
      slide.setValue(20);
      Animated.timing(slide, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const share = async () => {
    try {
      await Share.share({ message: `"${q?.quote}" - ${q?.author}` });
      showToast('Quote shared!');
    } catch {}
  };

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(''), 1800);
  };

  const openModal = () => {
    setModal(true);
    Animated.timing(modalAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setModal(false));
  };

  const debouncedSetType = (val: QuoteType) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => setType(val), 180);
  };

  useEffect(() => {
    AsyncStorage.getItem(LIKES_KEY).then(data => {
      if (data) setLikes(JSON.parse(data));
    });
    AsyncStorage.getItem(FAVORITES_KEY).then(data => {
      if (data) setFavorites(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/quotes', {
          headers: { 'Content-Type': 'application/json' },
        });
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setQuotes(data);
        }
      } catch {
        // fallback to DEFAULT_QUOTES if needed
      }
    })();
  }, []);

  const saveLikes = async (arr: Quote[]) => {
    setLikes(arr);
    await AsyncStorage.setItem(LIKES_KEY, JSON.stringify(arr));
  };

  const saveFavorites = async (arr: Quote[]) => {
    setFavorites(arr);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
  };

  const getQuoteId = (q: Quote | undefined) => q && (q.id ?? q.quote);

  const createUserQuoteLike = async (userId: string, quoteId: string) => {
    try {
      console.log('POST like:', { userId, quoteId });
      await axios.post(`http://localhost:8080/api/user-quote-likes/${userId}/${quoteId}`, {}, {
        headers: { 'Content-Type': 'application/json' },
      });
      return true;
    } catch (e) {
      console.log('POST like error:', e);
      return false;
    }
  };

  const createUserQuoteFavorite = async (userId: string, quoteId: string) => {
    try {
      console.log('POST favorite:', { userId, quoteId, favorite: true });
      await axios.post(`http://localhost:8080/api/user-quote-likes/${userId}/${quoteId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      return true;
    } catch (e) {
      console.log('POST favorite error:', e);
      return false;
    }
  };

  // Single PATCH function for like/favorite
  const updateUserQuote = async (quoteId: string, data: any) => {
    if (!userId) return false;
    try {
      console.log('PATCH user-quote:', { userId, quoteId, ...data });
      await axios.patch(`http://localhost:8080/api/user-quote-likes/${userId}/${quoteId}`, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      return true;
    } catch (e) {
      console.log('PATCH user-quote error:', e);
      return false;
    }
  };

  const isLiked = !!q && likes.some(f => f.quote === q.quote && f.author === q.author);
  const toggleLike = async () => {
    if (!q) return;
    const quoteId = getQuoteId(q);
    if (!quoteId) return;
    let arr;
    let newLike: boolean;
    if (isLiked) {
      arr = likes.filter(f => getQuoteId(f) !== quoteId);
      newLike = false;
    } else {
      arr = [...likes, q];
      newLike = true;
      if (userId) {
        await createUserQuoteLike(userId, String(quoteId));
      }
    }
    saveLikes(arr);
    showToast(isLiked ? 'Unliked' : 'Liked');
    await updateUserQuote(String(quoteId), { like: newLike });
  };

  const isFavorited = !!q && favorite.some(f => f.quote === q.quote && f.author === q.author);
  const toggleFavorite = async () => {
    if (!q) return;
    const quoteId = getQuoteId(q);
    if (!quoteId) return;
    let arr;
    let newFavorite: boolean;
    if (isFavorited) {
      arr = favorite.filter(f => getQuoteId(f) !== quoteId);
      newFavorite = false;
      if (userId) {
        await updateUserQuote(String(quoteId), { favorite: false });
      }
    } else {
      arr = [...favorite, q];
      newFavorite = true;
      if (userId) {
        await createUserQuoteFavorite(userId, String(quoteId));
      }
    }
    saveFavorites(arr);
    showToast(isFavorited ? 'Unfavorited' : 'Favorited');
    await updateUserQuote(String(quoteId), { favorite: newFavorite });
  };

  useEffect(() => { setQ(getRandom()); }, [type, search, showLikes, quotes]);
  useEffect(() => { setQ(getRandom()); }, [quotes]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 40) animate();
        else if (g.dx < -40) animate();
      }
    })
  ).current;

  const filterLabel = (val: string) => `Filter quotes by ${val}`;

  // Animate search bar expand/collapse
  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: showSearch ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [showSearch]);

  // Animate quote dropdown expand/collapse
  useEffect(() => {
    Animated.timing(quoteDropdownAnim, {
      toValue: showQuoteDropdown ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [showQuoteDropdown]);

  return (
    <LinearGradient
      colors={darkMode || colorScheme === 'dark'
        ? ['#181c22', '#181c22']
        : ['#fff', '#fff']}
      style={s.gradient}
    >
      <View style={s.container}>
        {/* Search bar and filter */}
        <View style={s.topBar}>
          <Pressable
            style={({ pressed }) => [
              s.iconBtn,
              pressed && { backgroundColor: theme.filterBg, transform: [{ scale: 0.95 }] }
            ]}
            onPress={() => setShowSearch(v => !v)}
            accessibilityRole="button"
            accessibilityLabel={showSearch ? "Hide search bar" : "Show search bar"}
          >
            <Icon name="search" size={24} color={theme.primary} />
          </Pressable>
          <Animated.View
            style={{
              flex: 1,
              marginLeft: 8,
              maxHeight: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 48] }),
              opacity: searchAnim,
              overflow: 'hidden',
            }}
          >
            {showSearch && (
              <TextInput
                style={[s.search, { backgroundColor: theme.inputBg, color: theme.text }]}
                placeholder="Search quotes..."
                placeholderTextColor={theme.placeholder}
                value={search}
                onChangeText={setSearch}
                accessibilityLabel="Search quotes"
                allowFontScaling
                autoFocus
              />
            )}
          </Animated.View>
          <Pressable
            style={({ pressed }) => [
              s.iconBtn,
              pressed && { backgroundColor: theme.filterBg, transform: [{ scale: 0.95 }] }
            ]}
            onPress={openModal}
            accessibilityRole="button"
            accessibilityLabel="Filter quotes"
          >
            <Icon name="filter-list" size={24} color={theme.primary} />
          </Pressable>
        </View>

        {/* Quote Card */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            s.quoteCard,
            {
              opacity: fade,
              transform: [{ translateY: slide }],
              backgroundColor: theme.card,
              shadowColor: theme.primary,
            }
          ]}
          accessibilityRole="text"
          accessibilityLabel={q ? `Quote: ${q.quote} by ${q.author}` : "No quote available"}
        >
          {q ? (
            <>
              <Text style={[s.quoteText, { color: theme.text }]} allowFontScaling>
                "{q.quote}"
              </Text>
              <Text style={[s.authorText, { color: theme.primary }]} allowFontScaling>
                — {q.author}
              </Text>
            </>
          ) : (
            <Text style={[s.quoteText, { color: theme.text }]} allowFontScaling>
              No quote available.
            </Text>
          )}
        </Animated.View>

        {/* Actions */}
        <View style={s.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              s.actionBtn,
              isLiked && { backgroundColor: theme.primary },
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
            ]}
            onPress={toggleLike}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? "Unlike quote" : "Like quote"}
          >
            <Icon name={isLiked ? "favorite" : "favorite-border"} size={26} color={isLiked ? "#fff" : theme.primary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              s.actionBtn,
              isFavorited && { backgroundColor: theme.primary },
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
            ]}
            onPress={toggleFavorite}
            accessibilityRole="button"
            accessibilityLabel={isFavorited ? "Unfavorite quote" : "Favorite quote"}
          >
            <Icon name={isFavorited ? "star" : "star-border"} size={26} color={isFavorited ? "#fff" : theme.primary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              s.actionBtn,
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
            ]}
            onPress={share}
            accessibilityRole="button"
            accessibilityLabel="Share this quote"
          >
            <Icon name="share" size={26} color={theme.primary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              s.actionBtn,
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
            ]}
            onPress={() => setShowQuoteDropdown(true)}
            accessibilityRole="button"
            accessibilityLabel="Select a quote"
          >
            <Icon name="menu-book" size={26} color={theme.primary} />
          </Pressable>
        </View>

        {/* Floating Next Button */}
        <Pressable
          style={({ pressed }) => [
            s.fab,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
          ]}
          onPress={animate}
          accessibilityRole="button"
          accessibilityLabel="Show another quote"
        >
          <Icon name="refresh" size={28} color="#fff" />
        </Pressable>

        {/* Quote Dropdown Modal */}
        <Modal visible={showQuoteDropdown} transparent animationType="fade" onRequestClose={() => setShowQuoteDropdown(false)}>
          <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPressOut={() => setShowQuoteDropdown(false)}>
            <Animated.View
              style={[
                s.dropdownModal,
                {
                  maxHeight: quoteDropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 400] }),
                  backgroundColor: theme.card,
                  opacity: quoteDropdownAnim,
                  overflow: 'hidden',
                }
              ]}
            >
              <Text style={[s.dropdownTitle, { color: theme.primary }]} allowFontScaling>
                Select a Quote
              </Text>
              <FlatList
                data={filtered}
                keyExtractor={item => String(item.id ?? item.quote)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.dropdownItem}
                    onPress={() => {
                      setQ(item);
                      setShowQuoteDropdown(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Select quote by ${item.author}`}
                  >
                    <Text style={{ color: theme.text }} numberOfLines={2} allowFontScaling>
                      "{item.quote.length > 60 ? item.quote.slice(0, 60) + '...' : item.quote}"
                    </Text>
                    <Text style={{ color: theme.primary, fontSize: 13 }} allowFontScaling>
                      — {item.author}
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 320 }}
              />
              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => setShowQuoteDropdown(false)}
                accessibilityRole="button"
                accessibilityLabel="Close quote dropdown"
              >
                <Icon name="close" size={22} color={theme.primary} />
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {/* Filter Modal */}
        <Modal visible={modal} transparent animationType="none" onRequestClose={closeModal}>
          <Animated.View style={[s.modalOverlay, { opacity: modalAnim }]}>
            <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPressOut={closeModal} accessibilityRole="button" accessibilityLabel="Close filter modal">
              <Animated.View style={[s.filterModal, { backgroundColor: theme.card }]}>
                <Text style={[s.dropdownTitle, { color: theme.primary }]} allowFontScaling>
                  Select Quote Type
                </Text>
                {OPTIONS.map(o => (
                  <TouchableOpacity
                    key={o.value}
                    style={[
                      s.filterOption,
                      type === o.value && [s.filterOptionActive, { borderColor: theme.primary }]
                    ]}
                    onPress={() => { closeModal(); debouncedSetType(o.value as QuoteType); }}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter quotes by ${o.label}`}
                  >
                    <Text style={[
                      s.filterOptionText,
                      type === o.value && [s.filterOptionTextActive, { color: theme.primary }]
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

        {/* Toast */}
        {toast ? (
          <View style={s.toast}>
            <Text style={s.toastText} allowFontScaling>{toast}</Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
};

// Modern color palette
const lightTheme = {
  bg: '#f7faff',
  card: '#fff',
  text: '#23272f',
  primary: '#4a6ea9',
  filterBg: '#eaf0fa',
  inputBg: '#f0f4ff',
  placeholder: '#a0a8b8'
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
  gradient: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
   
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 8,
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(74,110,169,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    // scale on press handled in component
  },
  search: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 0,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    shadowColor: '#4a6ea9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  quoteCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(74,110,169,0.10)',
    shadowColor: '#4a6ea9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 8,
    minHeight: 70,
    backdropFilter: 'blur(12px)', // for web, ignored on native
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0.12,
    color: '#23272f',
  },
  authorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
    opacity: 0.85,
    letterSpacing: 0.18,
    color: '#4a6ea9',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 0,
    marginTop: 0,
  },
  actionBtn: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(74,110,169,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(74,110,169,0.10)',
    // scale on press handled in component
  },
  fab: {
    position: 'absolute',
    bottom: 18,
    right: 14,
    backgroundColor: '#4a6ea9',
    borderRadius: 24,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#4a6ea9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    borderRadius: 18,
    padding: 14,
    width: 250,
    alignItems: 'stretch',
    elevation: 8,
    maxHeight: 260,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(74,110,169,0.13)',
    shadowColor: '#4a6ea9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.13,
    color: '#4a6ea9',
  },
  dropdownItem: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#eaf0fa',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 18,
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: 'rgba(74,110,169,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModal: {
    borderRadius: 18,
    padding: 14,
    width: 170,
    alignItems: 'stretch',
    elevation: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(74,110,169,0.13)',
    shadowColor: '#4a6ea9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: 'rgba(74,110,169,0.10)',
    borderWidth: 2,
    borderColor: '#4a6ea9',
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#23272f',
  },
  filterOptionTextActive: {
    fontWeight: 'bold',
    color: '#4a6ea9',
  },
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  toastText: {
    backgroundColor: 'rgba(74,110,169,0.92)',
    color: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    fontSize: 13,
    overflow: 'hidden',
    fontWeight: 'bold',
    letterSpacing: 0.13,
    shadowColor: '#4a6ea9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 2,
  },
});

export default MotivationalQuotes;