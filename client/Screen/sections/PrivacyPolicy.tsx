import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Linking from 'expo-linking';
import Header from '@/components/header';
import NavBar from '@/components/Navbar';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  border: string;
  cardBackground: string;
  blurTint: 'light' | 'dark';
}

const lightTheme: ThemeColors = {
  background: '#F2F2F7',
  text: '#1C1C1E',
  primary: '#a78bfa', // purple-400
  border: '#E5E7EB',
  cardBackground: 'rgba(255,255,255,0.85)',
  blurTint: 'light',
};

const darkTheme: ThemeColors = {
  background: '#18181b',
  text: '#E5E5E7',
  primary: '#a78bfa', // purple-400
  border: '#232536',
  cardBackground: 'rgba(36,37,46,0.85)',
  blurTint: 'dark',
};

interface PolicySection {
  id: string;
  title?: string;
  paragraphs: string[];
}

const privacyPolicySections: PolicySection[] = [
  {
    id: 'intro',
    paragraphs: [
      'Welcome to our Privacy Policy page. Your privacy is critically important to us. We are committed to safeguarding your personal information and ensuring transparency in how we handle it. This Privacy Policy outlines the types of information we collect, how we use it, and the measures we take to protect it.',
    ],
  },
  {
    id: 'infoCollect',
    title: '1. Information We Collect',
    paragraphs: [
      'We may collect personal information such as your name, email address, and usage data when you use our application. This information helps us improve our services and provide a better user experience.',
    ],
  },
  {
    id: 'infoUse',
    title: '2. How We Use Your Information',
    paragraphs: [
      'We use the information we collect to:',
      '- Provide, operate, and maintain our application.',
      '- Improve, personalize, and expand our services.',
      '- Communicate with you, including for customer support and updates.',
      '- Ensure the security of our platform.',
    ],
  },
  {
    id: 'infoShare',
    title: '3. Sharing Your Information',
    paragraphs: [
      'We do not sell or rent your personal information to third parties. However, we may share your information with trusted partners who assist us in operating our application, provided they agree to keep your information confidential.',
    ],
  },
  {
    id: 'yourRights',
    title: '4. Your Rights',
    paragraphs: [
      'You have the right to access, update, or delete your personal information. If you wish to exercise these rights, please contact us at [Insert Contact Information].',
    ],
  },
  {
    id: 'dataSecurity',
    title: '5. Data Security',
    paragraphs: [
      'We implement robust security measures to protect your personal information from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    id: 'policyChanges',
    title: '6. Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. Any changes will be posted on this page, and we encourage you to review it periodically.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    paragraphs: [
      'If you have any questions or concerns about our Privacy Policy or practices, please contact us at [Insert Contact Information]. Thank you for trusting us with your information.',
    ],
  },
];

const SectionItem: React.FC<{ section: PolicySection; colors: ThemeColors }> = React.memo(({ section, colors }) => (
  <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
    {section.title && (
      <Text
        style={[styles.sectionTitle, { color: colors.primary }]}
        accessibilityRole="header"
      >
        {section.title}
      </Text>
    )}
    {section.paragraphs.map((paragraph, index) => {
      if (paragraph.includes('[Insert Contact Information]')) {
        const parts = paragraph.split('[Insert Contact Information]');
        return (
          <Text key={index} style={[styles.paragraph, { color: colors.text }]}>
            {parts[0]}
            <Text
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL('mailto:contact@example.com')}
              accessibilityRole="link"
              accessibilityLabel="Contact us by email"
            >
              contact@example.com
            </Text>
            {parts[1]}
          </Text>
        );
      }
      // Render bullet points as list items
      if (paragraph.trim().startsWith('- ')) {
        return (
          <View key={index} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
            <Text style={[styles.bulletText, { color: colors.text }]}>{paragraph.replace('- ', '')}</Text>
          </View>
        );
      }
      return (
        <Text key={index} style={[styles.paragraph, { color: colors.text }]}>
          {paragraph}
        </Text>
      );
    })}
  </View>
));

const PrivacyPolicy: React.FC = () => {
  const navigation = useNavigation();
  // const colorScheme = useColorScheme();
  // const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem('darkMode').then(val => {
      setIsDarkMode(val ? JSON.parse(val) : false);
    });
  }, []);

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={{ flex: 1 }}>
      <BlurView
        intensity={60}
        tint={theme.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={[styles.headerBar, { borderBottomColor: theme.border, backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back to previous screen"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={28} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.primary }]}>Privacy Policy</Text>
          <View style={{ width: 28 }} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {privacyPolicySections.map((section, idx) => (
            <React.Fragment key={section.id}>
              <SectionItem section={section} colors={theme} />
              {idx < privacyPolicySections.length - 1 && (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              )}
            </React.Fragment>
          ))}
        </ScrollView>
        <NavBar />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderBottomWidth: 1,
    zIndex: 10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginHorizontal: 10,
    marginTop: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  pageTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'Roboto', default: undefined }),
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  sectionContainer: {
    marginBottom: 24,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    fontWeight: '400',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginLeft: 8,
  },
  bullet: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  divider: {
    height: 1.5,
    borderRadius: 1,
    marginVertical: 8,
    opacity: 0.18,
  },
});

export default PrivacyPolicy;