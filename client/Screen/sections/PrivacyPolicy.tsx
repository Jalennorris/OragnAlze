import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  useColorScheme, // Import useColorScheme
  Appearance, // Can be used if you need to subscribe to changes manually
  // Linking, // Remove this import
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Ensure this is installed
import Header from '@/components/header'; // Assuming this component exists and is themed
import NavBar from '@/components/Navbar'; // Assuming this component exists and is themed

// Define theme color interfaces
interface ThemeColors {
  background: string;
  text: string;
  primary: string; // For interactive elements like buttons or links
  border: string;
  cardBackground: string; // If you had distinct sections with backgrounds
}

// Define light and dark theme colors
const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  text: '#1C1C1E', // Slightly off-black
  primary: '#007AFF', // iOS Blue
  border: '#D1D1D6',
  cardBackground: '#F2F2F7',
};

const darkTheme: ThemeColors = {
  background: '#000000', // Pure black for OLED
  text: '#E5E5E7', // Slightly off-white
  primary: '#0A84FF', // iOS Blue (Dark Mode)
  border: '#38383A',
  cardBackground: '#1C1C1E',
};

// Define structure for privacy policy content
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

// SectionItem component for rendering each policy section
const SectionItem: React.FC<{ section: PolicySection; colors: ThemeColors }> = React.memo(({ section, colors }) => (
  <View style={styles.sectionContainer}>
    {section.title && (
      <Text
        style={[styles.sectionTitle, { color: colors.text }]}
        accessibilityRole="header"
      >
        {section.title}
      </Text>
    )}
    {section.paragraphs.map((paragraph, index) => {
      // If the paragraph contains [Insert Contact Information], replace it with a clickable link
      if (paragraph.includes('[Insert Contact Information]')) {
        const parts = paragraph.split('[Insert Contact Information]');
        return (
          <Text key={index} style={[styles.paragraph, { color: colors.text }]}>
            {parts[0]}
            <Text
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
              // onPress removed
            >
              contact@example.com
            </Text>
            {parts[1]}
          </Text>
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
  const colorScheme = useColorScheme(); // 'light', 'dark', or null
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme; // Default to light theme if null

  // Assuming Header and NavBar can accept a theme prop or consume a theme context
  // e.g., <Header theme={theme} />

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Header /> {/* Pass theme if Header supports it */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back to previous screen"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Privacy Policy</Text>
        <View style={{ width: 28 }} /> {/* Spacer to balance the title */}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {privacyPolicySections.map((section) => (
          <SectionItem key={section.id} section={section} colors={theme} />
        ))}
      </ScrollView>
      <NavBar /> {/* Pass theme if NavBar supports it */}
    </SafeAreaView>
  );
};

// Styles are defined once outside the component
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1, // Optional: Add a border to the header bar
    // borderBottomColor will be set by theme if needed, or remove if Header handles it
  },
  backButton: {
    padding: 8, // Increase touch target
    marginRight: 10,
  },
  pageTitle: {
    flex: 1, // Allow title to take available space
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12, // Space between paragraphs within a section
  },
});

export default PrivacyPolicy;