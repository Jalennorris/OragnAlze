import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  Pressable,
  Image,
  Animated,
  Easing,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Linking from 'react-native';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

const AVATAR_PLACEHOLDER = 'https://ui-avatars.com/api/?name=User&background=bbb&color=fff&size=128';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Section: React.FC<{ title: string; children: React.ReactNode; delay?: number }> = ({ title, children, delay = 0 }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(24)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        delay,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 480,
        delay,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
      <BlurView intensity={50} tint="light" style={modernStyles.section}>
        {title ? <Text style={modernStyles.sectionTitle}>{title}</Text> : null}
        <View style={modernStyles.sectionContent}>{children}</View>
      </BlurView>
    </Animated.View>
  );
};

const SettingRow: React.FC<{
  icon: string;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  color?: string;
  accessibilityLabel?: string;
}> = ({ icon, label, onPress, right, color, accessibilityLabel }) => (
  <Pressable
    onPress={() => {
      if (onPress) {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
      }
    }}
    android_ripple={{ color: '#e0e0e0' }}
    style={({ pressed }) => [
      modernStyles.settingRow,
      pressed && Platform.OS === 'ios' && { backgroundColor: '#f3f4f6' },
    ]}
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={accessibilityLabel || label}
  >
    <View style={modernStyles.settingLeft}>
      <Icon name={icon} size={24} color={color || '#6366f1'} />
      <Text style={modernStyles.settingText}>{label}</Text>
    </View>
    {right}
  </Pressable>
);

const Settings: React.FC = () => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(false);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = React.useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = React.useState(false);
  const [avatarScale] = React.useState(new Animated.Value(1));
  const [search, setSearch] = React.useState('');
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const [expoPushToken, setExpoPushToken] = React.useState<string | undefined>();

  // Parallax for profile header
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -24],
    extrapolate: 'clamp',
  });
  const avatarTranslate = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -12],
    extrapolate: 'clamp',
  });
  const avatarScaleAnim = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

  const animateAvatar = () => {
    Animated.sequence([
      Animated.spring(avatarScale, { toValue: 0.92, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    setAvatarModalVisible(true);
  };

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
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userId');
              navigation.navigate('login');
            } catch (error) {
              console.error('Failed to logout:', error);
            }
          },
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

    // Register for push notifications and get token
    const registerForPushNotifications = async () => {
      // Always request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'You must enable notifications in your dievice settings to receive push notifications.'
        );
        setExpoPushToken(undefined);
        return;
      }
      const tokenData = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(tokenData.data);
      console.log('Expo Push Token:', tokenData.data);

      // Send token to backend using axios
      try {
        await axios.post('http://localhost:8080/api/send-notification', {
          expoPushToken: tokenData.data,
          title: 'Welcome!',
          body: 'You are now registered for notifications.',
        });
      } catch (e) {
        // Handle error if needed
      }
    };
    registerForPushNotifications();

    // Listen for notifications when app is foregrounded
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      Alert.alert(
        notification.request.content.title || 'Notification',
        notification.request.content.body || ''
      );
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Demo: Send a local notification
  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification!',
      },
      trigger: null,
    });
  };

  return (
    <LinearGradient
      colors={
        isDarkModeEnabled
          ? ['#232526', '#414345', '#232526']
          : ['#f8fafc', '#e0e7ef', '#f8fafc']
      }
      style={{ flex: 1 }}
      start={[0, 0]}
      end={[1, 1]}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <StatusBar
          barStyle={isDarkModeEnabled ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <Animated.ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          <View style={modernStyles.container}>
            {/* Show Expo Push Token for debugging */}
            <View style={{ marginBottom: 12, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 8 }}>
              <Text selectable style={{ fontSize: 12, color: '#6366f1' }}>
                Expo Push Token:
              </Text>
              <Text selectable style={{ fontSize: 12, color: '#18181b' }}>
                {expoPushToken || 'No token yet'}
              </Text>
            </View>
            {/* Title */}
            <Text style={modernStyles.screenTitle}>Settings</Text>
            {/* Search Bar */}
            <View style={modernStyles.searchBarContainer}>
              <Icon name="search" size={22} color="#a5a5a5" style={{ marginLeft: 10 }} />
              <TextInput
                style={modernStyles.searchBar}
                placeholder="Search settings"
                placeholderTextColor="#bdbdbd"
                value={search}
                onChangeText={setSearch}
                editable={false} // UI only
              />
            </View>
            {/* Back Button */}
            <Pressable
              style={modernStyles.backButton}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                navigation.goBack();
              }}
              android_ripple={{ color: '#e0e0e0', borderless: true }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon name="arrow-back-ios" size={22} color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'} />
              <Text style={modernStyles.backButtonText}>Back</Text>
            </Pressable>

            {/* User Avatar and Name */}
            <Animated.View
              style={[
                modernStyles.profileHeader,
                { transform: [{ translateY: headerTranslate }] },
              ]}
            >
              <Animated.View
                style={[
                  modernStyles.avatarWrapper,
                  {
                    transform: [
                      { translateY: avatarTranslate },
                      { scale: avatarScaleAnim },
                    ],
                  },
                ]}
              >
                <Animated.Image
                  source={{ uri: AVATAR_PLACEHOLDER }}
                  style={[
                    modernStyles.avatar,
                    { transform: [{ scale: avatarScale }] },
                  ]}
                  accessibilityLabel="User avatar"
                />
                <TouchableOpacity
                  style={modernStyles.avatarEditBtn}
                  onPress={animateAvatar}
                  activeOpacity={0.7}
                >
                  <Icon name="photo-camera" size={18} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
              <Text style={modernStyles.profileName}>John Doe</Text>
              <Text style={modernStyles.profileEmail}>john.doe@email.com</Text>
            </Animated.View>

            {/* Account Section */}
            <Section title="Account" delay={100}>
              {/* Show Expo Push Token for debugging */}
              {expoPushToken && (
                <View style={{ marginBottom: 12, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 8 }}>
                  <Text selectable style={{ fontSize: 12, color: '#6366f1' }}>
                    Expo Push Token:
                  </Text>
                  <Text selectable style={{ fontSize: 12, color: '#18181b' }}>
                    {expoPushToken}
                  </Text>
                </View>
              )}
              <SettingRow
                icon="person"
                label="Edit Profile"
                onPress={() => navigation.navigate('sections/editProfile')}
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
              <SettingRow
                icon="lock"
                label="Change Password"
                onPress={() => navigation.navigate('sections/changePassword')}
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
              <SettingRow
                icon="email"
                label="Update Email"
                onPress={() => navigation.navigate('sections/updateEmail')}
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
            </Section>

            {/* Preferences Section */}
            <Section title="Preferences" delay={200}>
              <SettingRow
                icon="notifications"
                label="Enable Notifications"
                right={
                  <Switch
                    trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                    thumbColor={isNotificationsEnabled ? '#6366f1' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleNotifications}
                    value={isNotificationsEnabled}
                  />
                }
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
              <SettingRow
                icon="dark-mode"
                label="Dark Mode"
                right={
                  <Switch
                    trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                    thumbColor={isDarkModeEnabled ? '#6366f1' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleDarkMode}
                    value={isDarkModeEnabled}
                  />
                }
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
              <SettingRow
                icon="language"
                label="Language"
                onPress={() => navigation.navigate('languageSettings')}
                right={<Icon name="chevron-right" size={22} color="#bdbdbd" />}
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
              <SettingRow
                icon="fingerprint"
                label="Secure Settings"
                onPress={handleSecureSettings}
                right={<Icon name="chevron-right" size={22} color="#bdbdbd" />}
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
              <SettingRow
                icon="notifications-active"
                label="Send Test Notification"
                onPress={sendTestNotification}
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
            </Section>

            {/* Privacy Section */}
            <Section title="Privacy" delay={300}>
              <SettingRow
                icon="privacy-tip"
                label="Privacy Policy"
                onPress={handlePrivacyPolicy}
                right={<Icon name="chevron-right" size={22} color="#bdbdbd" />}
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
              <SettingRow
                icon="security"
                label="Security Settings"
                onPress={() => navigation.navigate('securitySettings')}
                right={<Icon name="chevron-right" size={22} color="#bdbdbd" />}
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
            </Section>

            {/* Support Section */}
            <Section title="Support" delay={400}>
              <SettingRow
                icon="help"
                label="Help & Support"
                onPress={() => navigation.navigate('helpSupport')}
                right={<Icon name="chevron-right" size={22} color="#bdbdbd" />}
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
              <SettingRow
                icon="feedback"
                label="Send Feedback"
                onPress={() => navigation.navigate('sendFeedback')}
                right={<Icon name="chevron-right" size={22} color="#bdbdbd" />}
                color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
              />
            </Section>

            {/* Logout */}
            <Section title="" delay={500}>
              <SettingRow
                icon="logout"
                label="Logout"
                onPress={handleLogout}
                color="#ef4444"
                accessibilityLabel="Logout"
                right={null}
              />
            </Section>
          </View>
        </Animated.ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={modernStyles.fab}
          onPress={() => Alert.alert('Add Account (Demo)', 'This is a demo FAB action.')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366f1', '#818cf8']}
            style={modernStyles.fabGradient}
            start={[0, 0]}
            end={[1, 1]}
          >
            <Icon name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Avatar Modal (Bottom Sheet UI only) */}
        <Modal
          visible={avatarModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setAvatarModalVisible(false)}
        >
          <View style={modernStyles.modalOverlay}>
            <View style={modernStyles.modalSheet}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Image
                  source={{ uri: AVATAR_PLACEHOLDER }}
                  style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 8 }}
                />
                <Text style={{ fontWeight: '700', fontSize: 18, color: '#18181b' }}>Change Avatar</Text>
              </View>
              <TouchableOpacity
                style={modernStyles.modalBtn}
                onPress={() => {
                  setAvatarModalVisible(false);
                  Alert.alert('Change Avatar', 'Avatar change UI goes here.');
                }}
              >
                <Icon name="photo-library" size={22} color="#6366f1" />
                <Text style={modernStyles.modalBtnText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modernStyles.modalBtn}
                onPress={() => {
                  setAvatarModalVisible(false);
                  Alert.alert('Take Photo', 'Camera UI goes here.');
                }}
              >
                <Icon name="photo-camera" size={22} color="#6366f1" />
                <Text style={modernStyles.modalBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modernStyles.modalBtn, { marginTop: 12 }]}
                onPress={() => setAvatarModalVisible(false)}
              >
                <Text style={[modernStyles.modalBtnText, { color: '#ef4444' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: 'transparent',
    paddingBottom: 80,
  },
  screenTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#18181b',
    marginBottom: 14,
    letterSpacing: -1.2,
    alignSelf: 'flex-start',
    fontFamily: Platform.select({ ios: 'AvenirNext-Bold', android: 'Roboto', default: undefined }),
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243,244,246,0.85)',
    borderRadius: 14,
    marginBottom: 18,
    marginTop: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBar: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#18181b',
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(243,244,246,0.7)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  backButtonText: {
    marginLeft: 2,
    fontSize: 17,
    color: '#6366f1',
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 50,
    padding: 6,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e0e7ef',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarEditBtn: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 5,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  profileName: {
    fontSize: 23,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  section: {
    marginBottom: 28,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 0.5,
    borderColor: 'rgba(99,102,241,0.08)',
    // BlurView will be applied here
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
    letterSpacing: 0.2,
    backgroundColor: 'transparent',
  },
  sectionContent: {},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
    backgroundColor: 'transparent',
    minHeight: 60,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 18,
    marginLeft: 16,
    color: '#18181b',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    zIndex: 100,
    elevation: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,41,59,0.18)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 16,
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 12,
  },
});

export default Settings;
