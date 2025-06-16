import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Share, Modal, TextInput, Platform, PanResponder, useColorScheme, FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

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
    <View style={[s.c, { backgroundColor: theme.bg }]}>
      {/* Search toggle button */}
      <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity
          style={[s.favBtn, { marginRight: 0 }]}
          onPress={() => setShowSearch(v => !v)}
          accessibilityRole="button"
          accessibilityLabel={showSearch ? "Hide search bar" : "Show search bar"}
        >
          <Icon name="search" size={22} color={theme.primary} />
        </TouchableOpacity>
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
      </View>
      <View style={{ alignSelf: 'stretch', marginBottom: 10 }}>
        <TouchableOpacity
          style={[s.fBtn, { backgroundColor: theme.filterBg, alignSelf: 'stretch', justifyContent: 'center' }]}
          onPress={() => setShowQuoteDropdown(true)}
          accessibilityRole="button"
          accessibilityLabel="Select a quote"
        >
          <Icon name="arrow-drop-down" size={22} color={theme.primary} />
          <Text style={[s.fBtnT, { color: theme.primary }]} allowFontScaling>
            {q ? `"${q.quote.slice(0, 32)}..."` : "Select a quote"}
          </Text>
        </TouchableOpacity>
      </View>
      {/* Animated Quote dropdown modal */}
      <Modal visible={showQuoteDropdown} transparent animationType="fade" onRequestClose={() => setShowQuoteDropdown(false)}>
        <TouchableOpacity style={s.mO} activeOpacity={1} onPressOut={() => setShowQuoteDropdown(false)}>
          <Animated.View
            style={[
              s.mC,
              {
                maxHeight: quoteDropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 400] }),
                width: 320,
                backgroundColor: theme.card,
                opacity: quoteDropdownAnim,
                overflow: 'hidden',
              }
            ]}
          >
            <Text style={[s.mT, { color: theme.primary }]} allowFontScaling>Select a Quote</Text>
            <FlatList
              data={filtered}
              keyExtractor={item => String(item.id ?? item.quote)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}
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
              style={[s.closeBtn, { alignSelf: 'flex-end', marginTop: 10 }]}
              onPress={() => setShowQuoteDropdown(false)}
              accessibilityRole="button"
              accessibilityLabel="Close quote dropdown"
            >
              <Icon name="close" size={22} color={theme.primary} />
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <TouchableOpacity style={s.actionsOverlay} activeOpacity={1} onPressOut={() => setShowActions(false)}>
          <View style={s.actionsModal}>
            <TouchableOpacity
              style={[s.fBtn, { backgroundColor: theme.filterBg }]}
              onPress={() => { setShowActions(false); openModal(); }}
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
              style={[s.favBtn, isLiked && { backgroundColor: theme.primary }]}
              onPress={() => { setShowActions(false); toggleLike(); }}
              accessibilityRole="button"
              accessibilityLabel={isLiked ? "Unlike quote" : "Like quote"}
            >
              <Icon name={isLiked ? "favorite" : "favorite-border"} size={22} color={isLiked ? "#fff" : theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.favBtn, isFavorited && { backgroundColor: theme.primary }]}
              onPress={() => { setShowActions(false); toggleFavorite(); }}
              accessibilityRole="button"
              accessibilityLabel={isFavorited ? "Unfavorite quote" : "Favorite quote"}
            >
              <Icon name={isFavorited ? "star" : "star-border"} size={22} color={isFavorited ? "#fff" : theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => setShowActions(false)}
              accessibilityRole="button"
              accessibilityLabel="Hide quote actions"
            >
              <Icon name="close" size={22} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
      <Animated.View
        {...panResponder.panHandlers}
        style={[s.qC, { opacity: fade, transform: [{ translateY: slide }] }]}
        accessibilityRole="text"
        accessibilityLabel={q ? `Quote: ${q.quote} by ${q.author}` : "No quote available"}
      >
        {q ? (
          <>
            <Text style={[s.qT, { color: theme.text }]} allowFontScaling>"{q.quote}"</Text>
            <Text style={[s.aT, { color: theme.primary }]} allowFontScaling>— {q.author}</Text>
          </>
        ) : (
          <Text style={[s.qT, { color: theme.text }]} allowFontScaling>No quote available.</Text>
        )}
      </Animated.View>
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
        <TouchableOpacity
          style={s.b}
          onPress={() => setShowActions(true)}
          accessibilityRole="button"
          accessibilityLabel="Show more quote actions"
        >
          <Icon name="more-horiz" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>
      {toast ? (
        <View style={s.toast}>
          <Text style={s.toastT} allowFontScaling>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
};

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
  topRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10, 
    alignSelf: 'stretch',
    gap: 20,
    paddingVertical: 6,
  },
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
  toastT: { backgroundColor: '#222c', color: '#fff', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, fontSize: 15, overflow: 'hidden' },
  moreBtn: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 24,
    marginLeft: 8,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsModal: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    elevation: 8,
    gap: 12,
  },
});

export default MotivationalQuotes;