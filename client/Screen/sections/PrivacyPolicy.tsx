import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Button, TouchableOpacity } from 'react-native'; // Import TouchableOpacity for custom button
import { useNavigation } from '@react-navigation/native'; // Import navigation hook
import { Ionicons } from '@expo/vector-icons'; // Import icons library
import Header from '@/components/header';
import NavBar from '@/components/Navbar';

const PrivacyPolicy: React.FC = () => {
  const navigation = useNavigation(); // Initialize navigation
  const [isDarkModeEnabled, setIsDarkModeEnabled] = React.useState(false); // Example state for theme

  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkModeEnabled ? '#121212' : '#ffffff', // Dark or light background
    },
    container: {
      flexGrow: 1,
      padding: 20,
    },
    content: {
      fontSize: 16,
      color: isDarkModeEnabled ? '#ffffff' : '#000000', // White text in dark mode, black in light mode
      lineHeight: 24,
    },
    backButton: {
      margin: 10,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <Header />
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={dynamicStyles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={isDarkModeEnabled ? '#ffffff' : '#000000'} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={dynamicStyles.container}>
        <Text style={dynamicStyles.content}>
          Welcome to our Privacy Policy page. Your privacy is critically important to us. 
          We are committed to safeguarding your personal information and ensuring transparency 
          in how we handle it. This Privacy Policy outlines the types of information we collect, 
          how we use it, and the measures we take to protect it.
          {"\n\n"}
          1. **Information We Collect**: 
          We may collect personal information such as your name, email address, and usage data 
          when you use our application. This information helps us improve our services and 
          provide a better user experience.
          {"\n\n"}
          2. **How We Use Your Information**: 
          We use the information we collect to:
          - Provide, operate, and maintain our application.
          - Improve, personalize, and expand our services.
          - Communicate with you, including for customer support and updates.
          - Ensure the security of our platform.
          {"\n\n"}
          3. **Sharing Your Information**: 
          We do not sell or rent your personal information to third parties. However, we may 
          share your information with trusted partners who assist us in operating our application, 
          provided they agree to keep your information confidential.
          {"\n\n"}
          4. **Your Rights**: 
          You have the right to access, update, or delete your personal information. If you wish 
          to exercise these rights, please contact us at [Insert Contact Information].
          {"\n\n"}
          5. **Data Security**: 
          We implement robust security measures to protect your personal information from 
          unauthorized access, alteration, or disclosure. However, no method of transmission 
          over the internet is 100% secure, and we cannot guarantee absolute security.
          {"\n\n"}
          6. **Changes to This Policy**: 
          We may update this Privacy Policy from time to time. Any changes will be posted on this 
          page, and we encourage you to review it periodically.
          {"\n\n"}
          If you have any questions or concerns about our Privacy Policy or practices, please 
          contact us at [Insert Contact Information]. Thank you for trusting us with your information.
        </Text>
      </ScrollView>
      <NavBar />
    </SafeAreaView>
  );
};

export default PrivacyPolicy;
