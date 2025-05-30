import React from 'react';
import { View, Text, StyleSheet, Switch, StatusBar, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native'; // Add Alert import
import { useTheme, useNavigation } from '@react-navigation/native'; // For theme support and navigation
import Icon from 'react-native-vector-icons/MaterialIcons'; // For icons
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Add this import
import * as Notifications from 'expo-notifications'; // Import expo-notifications
import * as Linking from 'react-native'; // Add Linking import
import Constants from 'expo-constants'; // Add Constants import
import * as LocalAuthentication from 'expo-local-authentication'; // Add LocalAuthentication import

const Settings: React.FC = () => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(false);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = React.useState(false);
  const { colors } = useTheme(); // Optional: For theme support
  const router = useRouter();
  const navigation = useNavigation();

  const toggleNotifications = async () => {
    if (!isNotificationsEnabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Notification permissions are required to enable notifications.');
        return;
      }
    }
    setIsNotificationsEnabled(previousState => !previousState);
  };

  const toggleDarkMode = async () => {
    const newMode = !isDarkModeEnabled;
    setIsDarkModeEnabled(newMode);
    await AsyncStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: async () => {
            try {
              await AsyncStorage.removeItem('userId');
              navigation.navigate('login');
            } catch (error) {
              console.error('Failed to logout:', error);
            }
          }
        },
      ],
      { cancelable: true }
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://your-privacy-policy-url.com');
  };

  const handleSecureSettings = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (!hasHardware || supportedTypes.length === 0) {
      Alert.alert('Error', 'Biometric authentication is not available on this device.');
    } else {
      const result = await LocalAuthentication.authenticateAsync();
      if (result.success) {
        navigation.navigate('secureSettings');
      } else {
        Alert.alert('Authentication Failed', 'Failed to authenticate.');
      }
    }
  };

  React.useEffect(() => {
    const checkNotificationPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setIsNotificationsEnabled(status === 'granted');
    };
    checkNotificationPermission();

    const loadDarkModePreference = async () => {
      const savedMode = await AsyncStorage.getItem('darkMode');
      if (savedMode !== null) {
        setIsDarkModeEnabled(JSON.parse(savedMode));
      }
    };
    loadDarkModePreference();
  }, []);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkModeEnabled ? '#121212' : '#ffffff', // Dark or light background
    },
    backButtonText: {
      marginLeft: 5,
      fontSize: 18,
      color: isDarkModeEnabled ? '#ffffff' : '#6200ee', // White text in dark mode
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 30,
      color: isDarkModeEnabled ? '#ffffff' : '#000000', // White text in dark mode
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 15,
      color: isDarkModeEnabled ? '#ffffff' : '#000000', // White text in dark mode
    },
    settingContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor: isDarkModeEnabled ? '#1e1e1e' : '#f5f5f5', // Adjust background color
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    settingText: {
      fontSize: 18,
      marginLeft: 15,
      color: isDarkModeEnabled ? '#ffffff' : '#000000', // White text in dark mode
    },
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={dynamicStyles.container}>
          <StatusBar
            barStyle={isDarkModeEnabled ? 'light-content' : 'dark-content'}
            backgroundColor={isDarkModeEnabled ? '#121212' : '#6200ee'}
          />
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
            <Text style={dynamicStyles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <Text style={dynamicStyles.title}>Settings</Text>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Account</Text>
            <TouchableOpacity style={dynamicStyles.settingContainer} onPress={() => navigation.navigate('sections/editProfile')}>
              <View style={styles.settingLeft}>
                <Icon name="person" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Edit Profile</Text>
              </View>
              <Icon name="chevron-right" size={24} color={isDarkModeEnabled ? '#ffffff' : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.settingContainer} onPress={() => navigation.navigate('sections/changePassword')}>
              <View style={styles.settingLeft}>
                <Icon name="lock" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Change Password</Text>
              </View>
              <Icon name="chevron-right" size={24} color={isDarkModeEnabled ? '#ffffff' : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.settingContainer} onPress={() => navigation.navigate('sections/updateEmail')}>
              <View style={styles.settingLeft}>
                <Icon name="email" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Update Email</Text>
              </View>
              <Icon name="chevron-right" size={24} color={isDarkModeEnabled ? '#ffffff' : colors.text} />
            </TouchableOpacity>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Preferences</Text>
            <View style={dynamicStyles.settingContainer}>
              <View style={styles.settingLeft}>
                <Icon name="notifications" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Enable Notifications</Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isNotificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleNotifications}
                value={isNotificationsEnabled}
              />
            </View>
            <View style={dynamicStyles.settingContainer}>
              <View style={styles.settingLeft}>
                <Icon name="dark-mode" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isDarkModeEnabled ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleDarkMode}
                value={isDarkModeEnabled}
              />
            </View>
            <TouchableOpacity style={dynamicStyles.settingContainer} onPress={() => navigation.navigate('languageSettings')}>
              <View style={styles.settingLeft}>
                <Icon name="language" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Language</Text>
              </View>
              <Icon name="chevron-right" size={24} color={isDarkModeEnabled ? '#ffffff' : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.settingContainer} onPress={handleSecureSettings}>
              <View style={styles.settingLeft}>
                <Icon name="fingerprint" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Secure Settings</Text>
              </View>
              <Icon name="chevron-right" size={24} color={isDarkModeEnabled ? '#ffffff' : colors.text} />
            </TouchableOpacity>
          </View>

          {/* Privacy Section */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Privacy</Text>
            <TouchableOpacity style={dynamicStyles.settingContainer} onPress={handlePrivacyPolicy}>
              <View style={styles.settingLeft}>
                <Icon name="privacy-tip" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Privacy Policy</Text>
              </View>
              <Icon name="chevron-right" size={24} color={isDarkModeEnabled ? '#ffffff' : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.settingContainer}>
              <View style={styles.settingLeft}>
                <Icon name="security" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Security Settings</Text>
              </View>
              <Icon name="chevron-right" size={24} color={isDarkModeEnabled ? '#ffffff' : colors.text} />
            </TouchableOpacity>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Support</Text>
            <TouchableOpacity style={dynamicStyles.settingContainer}>
              <View style={styles.settingLeft}>
                <Icon name="help" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Help & Support</Text>
              </View>
              <Icon name="chevron-right" size={24} color={isDarkModeEnabled ? '#ffffff' : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.settingContainer}>
              <View style={styles.settingLeft}>
                <Icon name="feedback" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Send Feedback</Text>
              </View>
              <Icon name="chevron-right" size={24} color={isDarkModeEnabled ? '#ffffff' : colors.text} />
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View style={styles.section}>
            <TouchableOpacity style={dynamicStyles.settingContainer} onPress={handleLogout}>
              <View style={styles.settingLeft}>
                <Icon name="logout" size={24} color={isDarkModeEnabled ? '#bb86fc' : '#6200ee'} />
                <Text style={dynamicStyles.settingText}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 18,
    color: '#6200ee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f5f5f5', // Light gray background for each setting
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 18,
    marginLeft: 15,
  },
});

export default Settings;
