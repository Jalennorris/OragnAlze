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

const FEEDBACK_EMAIL = 'feedback@organalze.com';
const FEEDBACK_BODY_MAX = 1000;
const { width } = Dimensions.get('window');

const SendFeedback: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [focusField, setFocusField] = useState<'subject' | 'body' | null>(null);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={{ flex: 1 }}>
        {/* Animated Gradient Background */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: bgInterpolate },
          ]}
        >
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(255,255,255,0.85)',
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
              <View style={styles.headerBlur}>
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Icon name="arrow-back-ios" size={22} color="#6366f1" />
                </Pressable>
              </View>
            </View>
            {/* Centered Title */}
            <View style={styles.centeredTitleRow}>
              <Text style={styles.feedbackTitle}>Feedback</Text>
            </View>
            {/* Parallax fade-in glassmorphism card */}
            <Animated.View style={[styles.centeredCardRow, { opacity: cardFade, transform: [{ translateY: cardTranslate }] }]}>
              <View style={styles.card}>
                {/* Floating label for subject */}
                <View style={styles.inputWrapper}>
                  <Animated.Text
                    style={[
                      styles.floatingLabel,
                      (focusField === 'subject' || subject) && styles.floatingLabelActive,
                    ]}
                    pointerEvents="none"
                  >
                    Subject (optional)
                  </Animated.Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusField === 'subject' && styles.inputFocused,
                    ]}
                    value={subject}
                    onChangeText={setSubject}
                    returnKeyType="next"
                    selectionColor="#6366f1"
                    onFocus={() => setFocusField('subject')}
                    onBlur={() => setFocusField(null)}
                  />
                </View>
                {/* Floating label for feedback */}
                <View style={styles.inputWrapper}>
                  <Animated.Text
                    style={[
                      styles.floatingLabel,
                      (focusField === 'body' || body) && styles.floatingLabelActive,
                    ]}
                    pointerEvents="none"
                  >
                    Your Feedback
                  </Animated.Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      focusField === 'body' && styles.inputFocused,
                    ]}
                    value={body}
                    onChangeText={text => {
                      if (text.length <= FEEDBACK_BODY_MAX) setBody(text);
                    }}
                    multiline
                    numberOfLines={6}
                    selectionColor="#6366f1"
                    onFocus={() => setFocusField('body')}
                    onBlur={() => setFocusField(null)}
                  />
                </View>
                <View style={styles.charCountRow}>
                  <Text style={styles.charCount}>{body.length}/{FEEDBACK_BODY_MAX}</Text>
                </View>
                {sent && (
                  <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                    <Icon name="refresh" size={20} color="#6366f1" />
                    <Text style={styles.resetText}>Reset</Text>
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
                (!body.trim() || loading) && styles.fabDisabled,
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
              <Text style={styles.toastText}>Feedback ready to send!</Text>
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
    alignItems: 'center', // Center everything horizontally
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
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
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
    color: '#6366f1',
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
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 32,
    padding: 36,
    shadowColor: '#6366f1',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
    marginHorizontal: 2,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.13)',
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
    color: '#a1a1aa',
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    fontWeight: '500',
    opacity: 0.85,
  },
  floatingLabelActive: {
    top: -12,
    fontSize: 13,
    color: '#6366f1',
    opacity: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6,
    fontWeight: '700',
  },
  input: {
    backgroundColor: 'rgba(241,245,249,0.92)',
    borderRadius: 18,
    padding: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    color: '#18181b',
    marginTop: 10,
    minHeight: 52,
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(224,231,255,0.98)',
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
    color: '#a1a1aa',
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
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  fabDisabled: {
    backgroundColor: '#a5b4fc',
  },
  toast: {
    position: 'absolute',
    bottom: 120,
    left: width * 0.15,
    right: width * 0.15,
    backgroundColor: 'rgba(55,48,163,0.97)',
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
    color: '#fff',
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
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  resetText: {
    alignSelf: 'center',
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default SendFeedback;
