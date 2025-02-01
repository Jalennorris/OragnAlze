import React from 'react';
import { View, Text, StyleSheet, Switch, StatusBar, TouchableOpacity } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native'; // For theme support and navigation
import Icon from 'react-native-vector-icons/MaterialIcons'; // For icons
import { useRouter } from 'expo-router';

const Settings: React.FC = () => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(false);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = React.useState(false);
  const { colors } = useTheme(); // Optional: For theme support
  const router = useRouter();
  const navigation = useNavigation();

  const toggleNotifications = () => setIsNotificationsEnabled(previousState => !previousState);
  const toggleDarkMode = () => setIsDarkModeEnabled(previousState => !previousState);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#6200ee" />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#6200ee" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        <TouchableOpacity style={styles.settingContainer} onPress={() => router.push('sections/editProfile')}> {/* Add onPress handler */}
          <View style={styles.settingLeft}>
            <Icon name="person" size={24} color="#6200ee" />
            <Text style={[styles.settingText, { color: colors.text }]}>Edit Profile</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingContainer} onPress={() => router.push('sections/changePassword')}>
          <View style={styles.settingLeft}>
            <Icon name="lock" size={24} color="#6200ee" />
            <Text style={[styles.settingText, { color: colors.text }]}>Change Password</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingContainer} onPress={() => router.push('sections/updateEmail')}>
          <View style={styles.settingLeft}>
            <Icon name="email" size={24} color="#6200ee" />
            <Text style={[styles.settingText, { color: colors.text }]}>Update Email</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
        <View style={styles.settingContainer}>
          <View style={styles.settingLeft}>
            <Icon name="notifications" size={24} color="#6200ee" />
            <Text style={[styles.settingText, { color: colors.text }]}>Enable Notifications</Text>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isNotificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleNotifications}
            value={isNotificationsEnabled}
          />
        </View>
        <View style={styles.settingContainer}>
          <View style={styles.settingLeft}>
            <Icon name="dark-mode" size={24} color="#6200ee" />
            <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkModeEnabled ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleDarkMode}
            value={isDarkModeEnabled}
          />
        </View>
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy</Text>
        <TouchableOpacity style={styles.settingContainer}>
          <View style={styles.settingLeft}>
            <Icon name="privacy-tip" size={24} color="#6200ee" />
            <Text style={[styles.settingText, { color: colors.text }]}>Privacy Policy</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingContainer}>
          <View style={styles.settingLeft}>
            <Icon name="security" size={24} color="#6200ee" />
            <Text style={[styles.settingText, { color: colors.text }]}>Security Settings</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
        <TouchableOpacity style={styles.settingContainer}>
          <View style={styles.settingLeft}>
            <Icon name="help" size={24} color="#6200ee" />
            <Text style={[styles.settingText, { color: colors.text }]}>Help & Support</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingContainer}>
          <View style={styles.settingLeft}>
            <Icon name="feedback" size={24} color="#6200ee" />
            <Text style={[styles.settingText, { color: colors.text }]}>Send Feedback</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
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