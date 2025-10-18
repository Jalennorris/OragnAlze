import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
  Platform,
  ActivityIndicator,
  Pressable, // <-- Add this import
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const LIGHT_COLORS = {
  background: '#f8fafc',
  card: 'rgba(255,255,255,0.85)',
  text: '#18181b',
  accent: '#6366f1',
  border: '#e0e0e0',
  placeholder: '#a1a1aa',
  link: '#6366f1',
};

const DARK_COLORS = {
  background: '#18181b',
  card: 'rgba(36,37,46,0.85)',
  text: '#f3f4f6',
  accent: '#a5b4fc',
  border: '#232336',
  placeholder: '#52525b',
  link: '#a5b4fc',
};

const SUPPORT_EMAIL = 'support@organalze.com';

const HelpSupport: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then(val => {
      setIsDarkMode(val ? JSON.parse(val) : false);
    });
  }, []);

  const COLORS = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  const handleEmail = () => {
    const subject = encodeURIComponent('Help & Support');
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: COLORS.background }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back-ios" size={22} color={COLORS.accent} />
          </Pressable>
          <Text style={[styles.title, { color: COLORS.accent }]}>Help & Support</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={[styles.card, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <Icon name="help-outline" size={48} color={COLORS.accent} style={{ marginBottom: 12 }} />
          <Text style={[styles.cardTitle, { color: COLORS.accent }]}>Need help?</Text>
          <Text style={[styles.cardDesc, { color: COLORS.text }]}>
            If you have any questions, issues, or feedback, please contact our support team. We're here to help!
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: COLORS.accent }]}
            onPress={handleEmail}
            activeOpacity={0.85}
            accessibilityLabel="Contact support by email"
            accessibilityRole="button"
          >
            <Icon name="email" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={[styles.buttonText, { color: '#fff' }]}>Contact Support</Text>
          </TouchableOpacity>
          <Text style={[styles.cardDesc, { color: COLORS.placeholder, marginTop: 18, fontSize: 13 }]}>
            We aim to respond within 24 hours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: Platform.OS === 'ios' ? 8 : 0,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#6366f1',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 14,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '400',
    paddingHorizontal: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 36,
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.2,
  },
});

export default HelpSupport;
