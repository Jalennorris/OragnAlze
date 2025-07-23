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
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

const AVATAR_PLACEHOLDER = 'https://ui-avatars.com/api/?name=User&background=bbb&color=fff&size=128';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Section: React.FC<{ title: string; children: React.ReactNode; delay?: number; dark?: boolean }> = ({
  title,
  children,
  delay = 0,
  dark = false,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(32)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 520,
        delay,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
      <BlurView
        intensity={70}
        tint={dark ? 'dark' : 'light'}
        style={[
          modernStyles.section,
          dark && { backgroundColor: 'rgba(36,37,46,0.85)', borderColor: 'rgba(129,140,248,0.08)' },
        ]}
      >
        {title ? (
          <Text
            style={[
              modernStyles.sectionTitle,
              dark && { color: '#a5b4fc', backgroundColor: 'transparent' },
            ]}
            accessibilityRole="header"
          >
            {title}
          </Text>
        ) : null}
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
  dark?: boolean;
}> = ({ icon, label, onPress, right, color, accessibilityLabel, dark }) => (
  <Pressable
    onPress={() => {
      if (onPress) {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
      }
    }}
    android_ripple={{ color: dark ? '#27272a' : '#e0e0e0' }}
    style={({ pressed }) => [
      modernStyles.settingRow,
      dark && { backgroundColor: 'transparent', borderBottomColor: '#27272a' },
      pressed && Platform.OS === 'ios' && { backgroundColor: dark ? '#232526' : '#f3f4f6' },
    ]}
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={accessibilityLabel || label}
  >
    <View style={modernStyles.settingLeft}>
      <Icon name={icon} size={26} color={color || (dark ? '#a5b4fc' : '#6366f1')} style={{ opacity: 0.92 }} />
      <Text
        style={[
          modernStyles.settingText,
          dark && { color: '#f3f4f6' },
        ]}
      >
        {label}
      </Text>
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
  const [firstname, setFirstname] = React.useState('');
  const [lastname, setLastname] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [profilePicColor, setProfilePicColor] = React.useState<string | undefined>(undefined);


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
    // Linking.openURL('https://your-privacy-policy-url.com');
    navigation.navigate('sections/privacyPolicy');
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

  // Add this function to handle Help & Support
  const handleHelpSupport = async () => {
    const email = 'support@organalze.com';
    const subject = encodeURIComponent('Help & Support');
    const url = `mailto:${email}?subject=${subject}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No email client is available to send support requests.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to open email client.');
    }
  };

  // Add this function to handle Send Feedback
  const handleSendFeedback = async () => {
    const email = 'feedback@organalze.com';
    const subject = encodeURIComponent('App Feedback');
    const url = `mailto:${email}?subject=${subject}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No email client is available to send feedback.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to open email client.');
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

    // Inline registerForPushNotifications logic here
    (async () => {
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
        return;
      }
    })();

    // Listen for notifications when app is foregrounded
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      Alert.alert(
        notification.request.content.title || 'Notification',
        notification.request.content.body || ''
      );
    });

    // Move async code into an IIFE
    (async () => {
      const userId = await AsyncStorage.getItem('userId');
      // Fetch user info
      axios.get(`http://localhost:8080/api/users/${userId}`)
        .then(res => {
          setFirstname(res.data.firstname || '');
          setLastname(res.data.lastname || '');
          setEmail(res.data.email || '');
          setProfilePicColor(res.data.profile_pic || undefined);
        })
        .catch(err => {
          console.error('Failed to fetch user info', err);
        });
    })();

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

  // Settings data arrays
  const accountRows = [
    {
      icon: "person",
      label: "Edit Profile",
      onPress: () => navigation.navigate('sections/editProfile'),
    },
    {
      icon: "lock",
      label: "Change Password",
      onPress: () => navigation.navigate('sections/changePassword'),
    },
    {
      icon: "email",
      label: "Update Email",
      onPress: () => navigation.navigate('sections/updateEmail'),
    },
  ];

  const preferencesRows = [
    {
      icon: "notifications",
      label: "Enable Notifications",
      right: (
        <Switch
          trackColor={{
            false: isDarkModeEnabled ? '#52525b' : '#d1d5db',
            true: isDarkModeEnabled ? '#818cf8' : '#6366f1',
          }}
          thumbColor={
            isNotificationsEnabled
              ? isDarkModeEnabled
                ? '#a5b4fc'
                : '#6366f1'
              : isDarkModeEnabled
              ? '#27272a'
              : '#f4f3f4'
          }
          ios_backgroundColor={isDarkModeEnabled ? '#27272a' : '#3e3e3e'}
          onValueChange={toggleNotifications}
          value={isNotificationsEnabled}
        />
      ),
    },
    {
      icon: "dark-mode",
      label: "Dark Mode",
      right: (
        <Switch
          trackColor={{
            false: isDarkModeEnabled ? '#52525b' : '#d1d5db',
            true: isDarkModeEnabled ? '#818cf8' : '#6366f1',
          }}
          thumbColor={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
          ios_backgroundColor={isDarkModeEnabled ? '#27272a' : '#3e3e3e'}
          onValueChange={toggleDarkMode}
          value={isDarkModeEnabled}
        />
      ),
    },
    {
      icon: "fingerprint",
      label: "Secure Settings",
      onPress: handleSecureSettings,
      right: <Icon name="chevron-right" size={22} color={isDarkModeEnabled ? '#52525b' : '#bdbdbd'} />,
    },
    {
      icon: "notifications-active",
      label: "Send Test Notification",
      onPress: sendTestNotification,
    },
  ];

  const privacyRows = [
    {
      icon: "privacy-tip",
      label: "Privacy Policy",
      onPress: handlePrivacyPolicy,
      right: <Icon name="chevron-right" size={22} color={isDarkModeEnabled ? '#52525b' : '#bdbdbd'} />,
    },
  ];

  const supportRows = [
    {
      icon: "help",
      label: "Help & Support",
      onPress: () => navigation.navigate('helpSupport'),
      right: <Icon name="chevron-right" size={22} color={isDarkModeEnabled ? '#52525b' : '#bdbdbd'} />,
    },
    {
      icon: "feedback",
      label: "Send Feedback",
      onPress: () => navigation.navigate('sendFeedback'),
      right: <Icon name="chevron-right" size={22} color={isDarkModeEnabled ? '#52525b' : '#bdbdbd'} />,
    },
  ];

  const logoutRows = [
    {
      icon: "logout",
      label: "Logout",
      onPress: handleLogout,
      color: "#ef4444",
      accessibilityLabel: "Logout",
      right: null,
    },
  ];

  // Filter function
  const filterRows = (rows: any[]) =>
    rows.filter(row =>
      row.label.toLowerCase().includes(search.trim().toLowerCase())
    );

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={
          isDarkModeEnabled
            ? ['#18181b', '#232526', '#18181b']
            : ['#f8fafc', '#e0e7ef', '#f8fafc']
        }
        style={{ flex: 1 }}
        start={[0, 0]}
        end={[1, 1]}
      >
        <BlurView
          intensity={60}
          tint={isDarkModeEnabled ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <StatusBar
            barStyle={isDarkModeEnabled ? 'light-content' : 'dark-content'}
            backgroundColor="transparent"
            translucent
          />
          <Animated.ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                modernStyles.container,
                isDarkModeEnabled && { backgroundColor: 'transparent' },
              ]}
            >
              {/* Title */}
              <Text
                style={[
                  modernStyles.screenTitle,
                  isDarkModeEnabled && { color: '#f3f4f6' },
                ]}
                accessibilityRole="header"
              >
                Settings
              </Text>
              {/* Search Bar */}
              <View
                style={[
                  modernStyles.searchBarContainer,
                  isDarkModeEnabled && {
                    backgroundColor: 'rgba(36,37,46,0.85)',
                    shadowColor: '#818cf8',
                  },
                ]}
              >
                <Icon
                  name="search"
                  size={22}
                  color={isDarkModeEnabled ? '#a5b4fc' : '#a5a5a5'}
                  style={{ marginLeft: 10 }}
                />
                <TextInput
                  style={[
                    modernStyles.searchBar,
                    isDarkModeEnabled && { color: '#f3f4f6' },
                  ]}
                  placeholder="Search settings"
                  placeholderTextColor={isDarkModeEnabled ? '#6b7280' : '#bdbdbd'}
                  value={search}
                  onChangeText={setSearch}
                  accessibilityLabel="Search settings"
                />
              </View>
              {/* Back Button */}
              <Pressable
                style={[
                  modernStyles.backButton,
                  isDarkModeEnabled && {
                    backgroundColor: 'rgba(36,37,46,0.7)',
                    shadowColor: '#818cf8',
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  navigation.goBack();
                }}
                android_ripple={{ color: isDarkModeEnabled ? '#27272a' : '#e0e0e0', borderless: true }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Icon
                  name="arrow-back-ios"
                  size={22}
                  color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'}
                />
                <Text
                  style={[
                    modernStyles.backButtonText,
                    isDarkModeEnabled && { color: '#a5b4fc' },
                  ]}
                >
                  Back
                </Text>
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
                    isDarkModeEnabled && { backgroundColor: '#232526' },
                    {
                      transform: [
                        { translateY: avatarTranslate },
                        { scale: avatarScaleAnim },
                      ],
                    },
                  ]}
                >
                  <Animated.Image
                    source={{ uri: profilePicColor }}
                    style={[
                      modernStyles.avatar,
                      { transform: [{ scale: avatarScale }] },
                      isDarkModeEnabled && {
                        backgroundColor: '#232526',
                        borderColor: '#18181b',
                      },
                      profilePicColor
                        ? { backgroundColor: profilePicColor }
                        : {},
                    ]}
                    accessibilityLabel="User avatar"
                  />
                 
                </Animated.View>
                <Text
                  style={[
                    modernStyles.profileName,
                    isDarkModeEnabled && { color: '#f3f4f6' },
                  ]}
                >
                  {firstname || lastname ? `${firstname} ${lastname}` : 'John Doe'}
                </Text>
                <Text
                  style={[
                    modernStyles.profileEmail,
                    isDarkModeEnabled && { color: '#a1a1aa' },
                  ]}
                >
                  {email || 'john.doe@email.com'}
                </Text>
              </Animated.View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: isDarkModeEnabled ? '#232536' : '#e5e7eb', marginVertical: 8, borderRadius: 2, opacity: 0.5 }} />

              {/* Account Section */}
              {filterRows(accountRows).length > 0 && (
                <Section title="Account" delay={100} dark={isDarkModeEnabled}>
                  {filterRows(accountRows).map((row, idx) => (
                    <SettingRow
                      key={row.label}
                      icon={row.icon}
                      label={row.label}
                      onPress={row.onPress}
                      right={row.right}
                      color={isDarkModeEnabled ? '#a5b4fc' : row.color || '#6366f1'}
                      accessibilityLabel={row.accessibilityLabel}
                      dark={isDarkModeEnabled}
                    />
                  ))}
                </Section>
              )}

              {/* Preferences Section */}
              {filterRows(preferencesRows).length > 0 && (
                <Section title="Preferences" dark={isDarkModeEnabled}>
                  {filterRows(preferencesRows).map((row, idx) => (
                    <SettingRow
                      key={row.label}
                      icon={row.icon}
                      label={row.label}
                      onPress={row.onPress}
                      right={row.right}
                      color={isDarkModeEnabled ? '#a5b4fc' : row.color || '#6366f1'}
                      accessibilityLabel={row.accessibilityLabel}
                      dark={isDarkModeEnabled}
                    />
                  ))}
                </Section>
              )}

              {/* Privacy Section */}
              {filterRows(privacyRows).length > 0 && (
                <Section title="Privacy" delay={300} dark={isDarkModeEnabled}>
                  {filterRows(privacyRows).map((row, idx) => (
                    <SettingRow
                      key={row.label}
                      icon={row.icon}
                      label={row.label}
                      onPress={row.onPress}
                      right={row.right}
                      color={isDarkModeEnabled ? '#a5b4fc' : row.color || '#6366f1'}
                      accessibilityLabel={row.accessibilityLabel}
                      dark={isDarkModeEnabled}
                    />
                  ))}
                </Section>
              )}

              {/* Support Section */}
              {filterRows(supportRows).length > 0 && (
                <Section title="Support" delay={400} dark={isDarkModeEnabled}>
                  {filterRows(supportRows).map((row, idx) => (
                    <SettingRow
                      key={row.label}
                      icon={row.icon}
                      label={row.label}
                      onPress={row.onPress}
                      right={row.right}
                      color={isDarkModeEnabled ? '#a5b4fc' : row.color || '#6366f1'}
                      accessibilityLabel={row.accessibilityLabel}
                      dark={isDarkModeEnabled}
                    />
                  ))}
                </Section>
              )}

              {/* Logout */}
              {filterRows(logoutRows).length > 0 && (
                <Section title="" delay={500} dark={isDarkModeEnabled}>
                  {filterRows(logoutRows).map((row, idx) => (
                    <SettingRow
                      key={row.label}
                      icon={row.icon}
                      label={row.label}
                      onPress={row.onPress}
                      right={row.right}
                      color={row.color}
                      accessibilityLabel={row.accessibilityLabel}
                      dark={isDarkModeEnabled}
                    />
                  ))}
                </Section>
              )}
            </View>
          </Animated.ScrollView>

          {/* Avatar Modal (Bottom Sheet UI only) */}
          <Modal
            visible={avatarModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setAvatarModalVisible(false)}
          >
            <View style={modernStyles.modalOverlay}>
              <View
                style={[
                  modernStyles.modalSheet,
                  isDarkModeEnabled && { backgroundColor: '#232526' },
                ]}
              >
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Image
                    source={{ uri: AVATAR_PLACEHOLDER }}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      marginBottom: 8,
                      backgroundColor: profilePicColor
                        ? profilePicColor
                        : isDarkModeEnabled
                        ? '#18181b'
                        : '#fff',
                    }}
                  />
                  <Text
                    style={{
                      fontWeight: '700',
                      fontSize: 18,
                      color: isDarkModeEnabled ? '#f3f4f6' : '#18181b',
                    }}
                  >
                    Change Avatar
                  </Text>
                </View>
                <TouchableOpacity
                  style={modernStyles.modalBtn}
                  onPress={() => {
                    setAvatarModalVisible(false);
                    Alert.alert('Change Avatar', 'Avatar change UI goes here.');
                  }}
                  accessibilityLabel="Choose avatar from gallery"
                >
                  <Icon name="photo-library" size={22} color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'} />
                  <Text
                    style={[
                      modernStyles.modalBtnText,
                      isDarkModeEnabled && { color: '#a5b4fc' },
                    ]}
                  >
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={modernStyles.modalBtn}
                  onPress={() => {
                    setAvatarModalVisible(false);
                    Alert.alert('Take Photo', 'Camera UI goes here.');
                  }}
                  accessibilityLabel="Take new avatar photo"
                >
                  <Icon name="photo-camera" size={22} color={isDarkModeEnabled ? '#a5b4fc' : '#6366f1'} />
                  <Text
                    style={[
                      modernStyles.modalBtnText,
                      isDarkModeEnabled && { color: '#a5b4fc' },
                    ]}
                  >
                    Take Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modernStyles.modalBtn, { marginTop: 12 }]}
                  onPress={() => setAvatarModalVisible(false)}
                  accessibilityLabel="Cancel avatar change"
                >
                  <Text
                    style={[
                      modernStyles.modalBtnText,
                      { color: '#ef4444' },
                      isDarkModeEnabled && { color: '#f87171' },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
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
    fontSize: 40,
    fontWeight: '900',
    color: '#18181b',
    marginBottom: 18,
    letterSpacing: -1.5,
    alignSelf: 'flex-start',
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'Roboto', default: undefined }),
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243,244,246,0.85)',
    borderRadius: 18,
    marginBottom: 22,
    marginTop: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
  searchBar: {
    flex: 1,
    height: 44,
    fontSize: 17,
    color: '#18181b',
    backgroundColor: 'transparent',
    borderRadius: 18,
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(243,244,246,0.7)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  backButtonText: {
    marginLeft: 3,
    fontSize: 18,
    color: '#6366f1',
    fontWeight: '700',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 50,
    padding: 7,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
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
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  profileName: {
    fontSize: 25,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 2,
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'Roboto', default: undefined }),
  },
  profileEmail: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 0.5,
    borderColor: 'rgba(99,102,241,0.08)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6366f1',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 7,
    letterSpacing: 0.2,
    backgroundColor: 'transparent',
  },
  sectionContent: {},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 22,
    paddingHorizontal: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
    backgroundColor: 'transparent',
    minHeight: 64,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 19,
    marginLeft: 18,
    color: '#18181b',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  fab: {
    position: 'absolute',
    right: 28,
    bottom: 38,
    zIndex: 100,
    elevation: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
  },
  fabGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 44,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 18,
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  modalBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 14,
  },
});

export default Settings;
