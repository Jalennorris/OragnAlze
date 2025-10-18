import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Animated,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Easing,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FEEDBACK_EMAIL = 'feedback@organalze.com';
const FEEDBACK_BODY_MAX = 1000;
const { width } = Dimensions.get('window');

const LIGHT_COLORS = {
  background: '#f8fafc',
  card: 'rgba(255,255,255,0.85)',
  text: '#18181b',
  accent: '#6366f1',
  accent2: '#818cf8',
  border: '#e0e7ef',
  placeholder: '#a1a1aa',
  error: '#f87171',
  toast: 'rgba(55,48,163,0.97)',
  toastText: '#fff',
  fab: '#6366f1',
  fabDisabled: '#a5b4fc',
};

const DARK_COLORS = {
  background: '#18181b',
  card: 'rgba(36,37,46,0.85)',
  text: '#f3f4f6',
  accent: '#a5b4fc',
  accent2: '#818cf8',
  border: '#232336',
  placeholder: '#52525b',
  error: '#f87171',
  toast: 'rgba(129,140,248,0.97)',
  toastText: '#18181b',
  fab: '#a5b4fc',
  fabDisabled: '#232336',
};

const SendFeedback: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [focusField, setFocusField] = useState<'subject' | 'body' | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigation = useNavigation();
  const fabScale = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardFade, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then(val => {
      setIsDarkMode(val ? JSON.parse(val) : false);
    });
  }, []);

  // Animated gradient background
  const gradientAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, { toValue: 1, duration: 6000, useNativeDriver: false }),
        Animated.timing(gradientAnim, { toValue: 0, duration: 6000, useNativeDriver: false }),
      ])
    ).start();
  }, []);
  const bgInterpolate = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'rgba(99,102,241,0.13)', // start
      'rgba(129,140,248,0.18)', // end
    ],
  });

  // Parallax card
  const cardTranslate = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -16],
    extrapolate: 'clamp',
  });

  const handleSend = async () => {
    if (!body.trim()) {
      Alert.alert('Feedback Required', 'Please enter your feedback before sending.');
      return;
    }
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(fabScale, { toValue: 0.92, useNativeDriver: true }).start();
    const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject || 'App Feedback')}&body=${encodeURIComponent(body)}`;
    try {
      const supported = await Linking.canOpenURL(mailto);
      if (supported) {
        Linking.openURL(mailto);
        setSent(true);
        Animated.timing(checkAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        showSuccessToast();
      } else {
        Alert.alert('Error', 'No email client is available to send feedback.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to open email client.');
    } finally {
      setTimeout(() => {
        setLoading(false);
        Animated.spring(fabScale, { toValue: 1, useNativeDriver: true }).start();
        setTimeout(() => {
          setSent(false);
          checkAnim.setValue(0);
        }, 1200);
      }, 800);
    }
  };

  const handleReset = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubject('');
    setBody('');
    setSent(false);
    checkAnim.setValue(0);
  };

  const showSuccessToast = () => {
    setShowToast(true);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.in(Easing.exp),
        }).start(() => setShowToast(false));
      }, 1800);
    });
  };

  const COLORS = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flex: 1 }}>
        {/* Animated Gradient Background */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDarkMode ? '#18181b' : bgInterpolate },
          ]}
        >
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: COLORS.card,
            }}
          />
        </Animated.View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.ScrollView
            contentContainerStyle={styles.outerContainer}
            keyboardShouldPersistTaps="handled"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {/* Minimal icon-only header */}
            <View style={styles.headerContainer}>
              <View style={[styles.headerBlur, { backgroundColor: COLORS.card }]}>
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Icon name="arrow-back-ios" size={22} color={COLORS.accent} />
                </Pressable>
              </View>
            </View>
            {/* Centered Title */}
            <View style={styles.centeredTitleRow}>
              <Text style={[styles.feedbackTitle, { color: COLORS.accent }]}>Feedback</Text>
            </View>
            {/* Parallax fade-in glassmorphism card */}
            <Animated.View style={[styles.centeredCardRow, { opacity: cardFade, transform: [{ translateY: cardTranslate }] }]}>
              <View style={[styles.card, { backgroundColor: COLORS.card, borderColor: COLORS.border, shadowColor: COLORS.accent }]}>
                {/* Floating label for subject */}
                <View style={styles.inputWrapper}>
                  <Animated.Text
                    style={[
                      styles.floatingLabel,
                      (focusField === 'subject' || subject) && [styles.floatingLabelActive, { color: COLORS.accent, backgroundColor: COLORS.card }],
                    ]}
                    pointerEvents="none"
                  >
                    Subject (optional)
                  </Animated.Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusField === 'subject' && [styles.inputFocused, { borderColor: COLORS.accent, backgroundColor: COLORS.card }],
                      { color: COLORS.text, backgroundColor: COLORS.card, borderColor: COLORS.border },
                    ]}
                    value={subject}
                    onChangeText={setSubject}
                    returnKeyType="next"
                    selectionColor={COLORS.accent}
                    onFocus={() => setFocusField('subject')}
                    onBlur={() => setFocusField(null)}
                    placeholderTextColor={COLORS.placeholder}
                  />
                </View>
                {/* Floating label for feedback */}
                <View style={styles.inputWrapper}>
                  <Animated.Text
                    style={[
                      styles.floatingLabel,
                      (focusField === 'body' || body) && [styles.floatingLabelActive, { color: COLORS.accent, backgroundColor: COLORS.card }],
                    ]}
                    pointerEvents="none"
                  >
                    Your Feedback
                  </Animated.Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      focusField === 'body' && [styles.inputFocused, { borderColor: COLORS.accent, backgroundColor: COLORS.card }],
                      { color: COLORS.text, backgroundColor: COLORS.card, borderColor: COLORS.border },
                    ]}
                    value={body}
                    onChangeText={text => {
                      if (text.length <= FEEDBACK_BODY_MAX) setBody(text);
                    }}
                    multiline
                    numberOfLines={6}
                    selectionColor={COLORS.accent}
                    onFocus={() => setFocusField('body')}
                    onBlur={() => setFocusField(null)}
                    placeholderTextColor={COLORS.placeholder}
                  />
                </View>
                <View style={styles.charCountRow}>
                  <Text style={[styles.charCount, { color: COLORS.placeholder }]}>{body.length}/{FEEDBACK_BODY_MAX}</Text>
                </View>
                {sent && (
                  <TouchableOpacity style={[styles.resetBtn, { backgroundColor: COLORS.card }]} onPress={handleReset}>
                    <Icon name="refresh" size={20} color={COLORS.accent} />
                    <Text style={[styles.resetText, { color: COLORS.accent }]}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </Animated.ScrollView>
          {/* Animated Floating send button with checkmark animation */}
          <Animated.View
            style={[
              styles.fabContainer,
              {
                transform: [{ scale: fabScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.fab,
                { backgroundColor: COLORS.fab },
                (!body.trim() || loading) && [styles.fabDisabled, { backgroundColor: COLORS.fabDisabled }],
              ]}
              onPress={handleSend}
              accessibilityLabel="Send feedback"
              activeOpacity={0.85}
              disabled={!body.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : sent ? (
                <Animated.View style={{ opacity: checkAnim }}>
                  <Icon name="check-circle" size={32} color="#fff" />
                </Animated.View>
              ) : (
                <Icon name="send" size={28} color="#fff" />
              )}
            </TouchableOpacity>
          </Animated.View>
          {/* Toast/snackbar */}
          {showToast && (
            <Animated.View
              style={[
                styles.toast,
                {
                  backgroundColor: COLORS.toast,
                  opacity: toastAnim,
                  transform: [
                    {
                      translateY: toastAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={[styles.toastText, { color: COLORS.toastText }]}>Feedback ready to send!</Text>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    minHeight: '100%',
    backgroundColor: 'transparent',
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    width: 56,
    alignSelf: 'flex-start',
    shadowColor: '#6366f1',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginLeft: 8,
    marginTop: 24,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 18,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 0,
    shadowColor: '#fff',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 2,
  },
  centeredTitleRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    alignSelf: 'center',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  centeredCardRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  card: {
    borderRadius: 32,
    padding: 36,
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
    marginHorizontal: 2,
    marginBottom: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    width: Math.min(width * 0.95, 440),
    alignSelf: 'center',
  },
  inputWrapper: {
    marginBottom: 36,
    position: 'relative',
    minHeight: 56,
  },
  floatingLabel: {
    position: 'absolute',
    left: 22,
    top: 24,
    fontSize: 17,
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    fontWeight: '500',
    opacity: 0.85,
  },
  floatingLabelActive: {
    top: -12,
    fontSize: 13,
    opacity: 1,
    paddingHorizontal: 6,
    fontWeight: '700',
  },
  input: {
    borderRadius: 18,
    padding: 20,
    fontSize: 16,
    borderWidth: 1,
    marginTop: 10,
    minHeight: 52,
    fontWeight: '500',
  },
  inputFocused: {
    shadowColor: '#6366f1',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    fontWeight: '500',
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    justifyContent: 'center',
  },
  fab: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  fabDisabled: {
  },
  toast: {
    position: 'absolute',
    bottom: 120,
    left: width * 0.15,
    right: width * 0.15,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#3730a3',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  resetText: {
    alignSelf: 'center',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default SendFeedback;
