import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'; // Import manipulator
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';

// Define the structure for user credentials
interface Credentials {
  firstName: string;
  lastName: string;
  email: string;
  profilePic: string | null; // Can be a public URL string, color string, or null
  displayName: string;
}

// --- Constants ---
const COLORS = {
  primary:  '#4A2A8A', // Modern purple
  secondary: '#38BDF8', // Modern blue
  background: '#F9FAFB', // Light background
  error: '#EF4444', // Red-500
  text: '#1E293B', // Slate-800
  placeholder: '#94A3B8', // Slate-400
  modalBackground: 'rgba(30, 41, 59, 0.5)', // Slate-800, semi-transparent
  card: '#FFFFFF', // Pure white card
  border: '#E5E7EB', // Slate-200
  shadow: '#00000022',
  accent: '#F472B6', // Pink-400
  success: '#22C55E', // Green-500
  gradientStart: '#7F56D9',
  gradientEnd: '#38BDF8',
};

const DARK_COLORS = {
  primary: '#a5b4fc',
  secondary: '#818cf8',
  background: '#18181b',
  error: '#f87171',
  text: '#f3f4f6',
  placeholder: '#52525b',
  modalBackground: 'rgba(36,37,46,0.85)',
  card: 'rgba(36,37,46,0.85)',
  border: '#232336',
  shadow: '#232336',
  accent: '#818cf8',
  success: '#34d399',
  gradientStart: '#818cf8',
  gradientEnd: '#6366f1',
};

const LIGHT_COLORS = COLORS;

const SIZES = {
  padding: 24,
  borderRadius: 18,
  iconSize: 28,
  profileImageSize: 128,
  colorBlockSize: 64,
};

// Predefined colors for profile picture selection
const colorBlocks = [
  '#B71C1C', // Dark Red
  '#1B5E20', // Dark Green
  '#0D47A1', // Dark Blue
  '#880E4F', // Dark Pink
  '#B8860B', // Dark Gold
  '#4B0082', // Indigo
  '#00695C', // Dark Teal
  '#1565C0', // Darker Blue
  '#C62828', // Darker Red
  '#2E7D32', // Darker Green
  '#6A1B9A', // Dark Purple
  '#263238', // Blue Gray
  '#FF8C00', // Dark Orange
  '#A0522D', // Sienna
  '#616161', // Dark Gray
  '#374151', // Slate
];
// --- Validation Schema ---
const profileSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
});

// --- Reusable Components ---
const BackButton = ({ onPress, themeColors }: { onPress: () => void; themeColors: typeof COLORS }) => (
  <TouchableOpacity style={[styles.backButton, { backgroundColor: themeColors.primary + '18' }]} onPress={onPress}>
    <Icon name="arrow-back" size={SIZES.iconSize} color={themeColors.text} />
    <Text style={[styles.backButtonText, { color: themeColors.primary }]}>Back</Text>
  </TouchableOpacity>
);

const ProfileImage = ({
  uri,
  color,
  onPress,
  themeColors,
}: {
  uri?: string;
  color?: string;
  onPress: () => void;
  themeColors: typeof COLORS;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.profileImageContainer,
      {
        shadowColor: themeColors.primary,
        backgroundColor: themeColors.card,
        borderColor: themeColors.border,
      },
    ]}
    activeOpacity={0.75}
  >
    {uri ? (
      <>
        <Image
          source={{ uri: uri }}
          style={[styles.profileImage, { backgroundColor: themeColors.placeholder, borderColor: themeColors.background }]}
          onError={e => console.log('Failed to load image:', e.nativeEvent.error)}
        />
        <LinearGradient
          colors={[themeColors.gradientStart, themeColors.gradientEnd]}
          style={styles.profileImageOverlay}
        >
          <Icon name="photo-camera" size={36} color={themeColors.text} />
        </LinearGradient>
      </>
    ) : color ? (
      <>
        <View style={[styles.colorBlockDisplay, { backgroundColor: color, borderColor: themeColors.background }]}>
          <Icon name="person" size={62} color={themeColors.text} />
        </View>
        <LinearGradient
          colors={[themeColors.gradientStart, themeColors.gradientEnd]}
          style={styles.profileImageOverlay}
        >
          <Icon name="photo-camera" size={36} color={themeColors.text} />
        </LinearGradient>
      </>
    ) : (
      <View style={[styles.profileImagePlaceholder, { backgroundColor: themeColors.border, borderColor: themeColors.placeholder }]}>
        <Icon name="add-a-photo" size={62} color={themeColors.text} />
      </View>
    )}
  </TouchableOpacity>
);


// --- Main EditProfile Component ---
const EditProfile: React.FC = () => {
  // --- State Variables ---
  // profileImage: stores either a local file URI (if newly selected) or a public URL (if fetched/uploaded)
  // selectedColor: stores the selected color hex for profile picture
  // isLoading: indicates loading state for async actions
  // isModalVisible: controls visibility of the color selection modal
  // credentials: stores user profile info
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [credentials, setCredentials] = useState<Credentials>({
    firstName: '',
    lastName: '',
    email: '',
    profilePic: null, // This should store the public URL or color hex from the DB
    displayName: '',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const navigation = useNavigation();

  useEffect(() => {
    getUserInfo();
    AsyncStorage.getItem('darkMode').then(val => {
      setIsDarkMode(val ? JSON.parse(val) : false);
    });
    // Optionally loadProfilePreference as fallback if needed
  }, []);

  const themeColors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  // --- Helper Function ---
  // Checks if a string is a local file URI (used to determine if image needs upload)
  const isLocalFileUri = (uri: string | null): boolean => {
    return !!uri && (uri.startsWith('file://') || uri.startsWith('content://'));
  };

  // --- Async Functions ---

 
  // Saves profile picture/color preference to AsyncStorage
  const saveProfilePreference = async (preference: string | null) => {
    try {
      // Save the public URL or color hex
      if (preference) {
        await AsyncStorage.setItem('profilePreference', preference);
      } else {
        await AsyncStorage.removeItem('profilePreference');
      }
    } catch (error) {
      console.error('Failed to save profile preference:', error);
    }
  };

  // Fetches user info from backend and sets local state
  const getUserInfo = async () => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found in storage. Please log in again.');
      }
      const response = await axios.get(`http://localhost:8080/api/users/${userId}`);
      const data = response.data;

      setCredentials({
        firstName: data.firstname || '',
        lastName: data.lastname || '',
        email: data.email || '',
        profilePic: data.profile_pic || null, // Store the URL/color from DB
        displayName: data.username || '',
      });
      console.log('Fetched user info:', setCredentials);

      // Set initial display state based on fetched data (URL or color)
      if (data.profile_pic) {
        if (data.profile_pic.startsWith('#')) {
          setSelectedColor(data.profile_pic);
          setProfileImage(null);
        } else {
          // Assume it's a public URL
          setProfileImage(data.profile_pic);
          setSelectedColor(null);
        }
      } else {
        // No picture in DB, clear local state
        setProfileImage(null);
        setSelectedColor(null);
        // Optionally load local preference as fallback?
        // await loadProfilePreference();
      }
      console.log('Fetched user info:', data);
      setFormKey(prev => prev + 1); // Force Formik to reinitialize
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch user information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Image/Color Selection Handlers (image upload/take photo are unused, but left for reference) ---
  // Handle image selection from library (unused)


  // Handle color selection for profile picture
  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    setProfileImage(null); // Clear any selected image URI/URL
    setIsModalVisible(false);
    saveProfilePreference(color);
  }, [setIsModalVisible, setProfileImage, setSelectedColor]);

  // --- Combined Save Handler ---
  const handleSaveAll = async (values: { firstName: string; lastName: string; email: string }) => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found. Please log in again.');

      // Save profile picture (color) if changed
      if (selectedColor && selectedColor !== credentials.profilePic) {
        await axios.patch(
          `http://localhost:8080/api/users/${userId}/profile-pic`,
          { profile_pic: selectedColor },
          { headers: { 'Content-Type': 'application/json' } }
        );
        setProfileImage(null);
        setCredentials(prev => ({ ...prev, profilePic: selectedColor }));
        await saveProfilePreference(selectedColor);
      }

      // Save profile info (name/email)
      await axios.patch(`http://localhost:8080/api/users/${userId}`, {
        firstname: values.firstName,
        lastname: values.lastName,
        email: values.email,
      });

      setCredentials(prev => ({
        ...prev,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        profilePic: selectedColor ?? prev.profilePic,
      }));
      setFormKey(prev => prev + 1);

      Alert.alert('Success', 'Profile updated successfully!');
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error: any) {
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error?.response) {
        errorMessage = `Server error: ${error.response.data?.message || error.response.status}`;
      } else if (error?.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setIsRefreshing(true);
    await getUserInfo();
    setIsRefreshing(false);
  };

  // --- Render Functions ---
  // Renders a selectable color block for the modal
  const renderColorBlock = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.colorBlockSelect,
        { backgroundColor: item },
        selectedColor === item && styles.colorBlockSelected,
      ]}
      onPress={() => handleColorSelect(item)}
      activeOpacity={0.7}
    >
      <Animated.View style={[
        styles.colorBlockInner,
        selectedColor === item && styles.colorBlockInnerSelected
      ]} />
      {selectedColor === item && (
        <View style={styles.colorBlockCheckWrapper}>
          <Icon name="check" size={30} color={themeColors.text} style={styles.colorBlockCheck} />
        </View>
      )}
    </TouchableOpacity>
  );

  // --- Main JSX Return ---
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          <BackButton onPress={() => navigation.goBack()} themeColors={themeColors} />
          <Text style={[styles.title, { color: themeColors.text }]}>Edit Profile</Text>

          {/* Profile Picture Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, shadowColor: themeColors.shadow }]}>
            <ProfileImage
              uri={profileImage ?? undefined}
              color={!profileImage ? selectedColor ?? undefined : undefined}
              onPress={() => setIsModalVisible(true)}
              themeColors={themeColors}
            />
            {credentials.displayName && (
              <Text style={[styles.displayName, { color: themeColors.text }]}>@{credentials.displayName}</Text>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          {/* Profile Info Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, shadowColor: themeColors.shadow }]}>
            <Formik
              key={formKey}
              initialValues={{
                firstName: credentials.firstName,
                lastName: credentials.lastName,
                email: credentials.email
              }}
              validationSchema={profileSchema}
              enableReinitialize
              onSubmit={handleSaveAll}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={[styles.formContainer]}>
                  <View style={styles.inputContainer}>
                    <Icon name="person-outline" size={SIZES.iconSize} color={themeColors.text} style={styles.icon} />
                    <TextInput
                      style={[styles.input, { color: themeColors.text, backgroundColor: 'transparent' }]}
                      placeholder="First Name"
                      placeholderTextColor={themeColors.placeholder}
                      value={values.firstName}
                      onChangeText={handleChange('firstName')}
                      onBlur={handleBlur('firstName')}
                      autoCapitalize="words"
                      selectionColor={themeColors.primary}
                    />
                  </View>
                  {touched.firstName && errors.firstName && <Text style={[styles.errorText, { color: themeColors.error }]}>{errors.firstName}</Text>}

                  <View style={styles.inputContainer}>
                    <Icon name="person-outline" size={SIZES.iconSize} color={themeColors.text} style={styles.icon} />
                    <TextInput
                      style={[styles.input, { color: themeColors.text, backgroundColor: 'transparent' }]}
                      placeholder="Last Name"
                      placeholderTextColor={themeColors.placeholder}
                      value={values.lastName}
                      onChangeText={handleChange('lastName')}
                      onBlur={handleBlur('lastName')}
                      autoCapitalize="words"
                      selectionColor={themeColors.primary}
                    />
                  </View>
                  {touched.lastName && errors.lastName && <Text style={[styles.errorText, { color: themeColors.error }]}>{errors.lastName}</Text>}

                  <View style={styles.inputContainer}>
                    <Icon name="mail-outline" size={SIZES.iconSize} color={themeColors.text} style={styles.icon} />
                    <TextInput
                      style={[styles.input, { color: themeColors.text, backgroundColor: 'transparent' }]}
                      placeholder="Email Address"
                      placeholderTextColor={themeColors.placeholder}
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      selectionColor={themeColors.primary}
                    />
                  </View>
                  {touched.email && errors.email && <Text style={[styles.errorText, { color: themeColors.error }]}>{errors.email}</Text>}

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => handleSubmit()}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[themeColors.gradientStart, themeColors.gradientEnd]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    {isLoading ? (
                      <ActivityIndicator color={themeColors.background} />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>

          {/* Profile Picture Selection Modal */}
          <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                {/* Modal drag indicator */}
                <View style={styles.dragIndicatorOuter}>
                  <View style={[styles.dragIndicator, { backgroundColor: themeColors.border }]} />
                </View>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Choose Profile Picture</Text>
                <Text style={[styles.modalSubtitle, { color: themeColors.placeholder }]}>Select a color for your profile picture</Text>
                {/* Color selection grid */}
                <FlatList
                  data={colorBlocks}
                  renderItem={renderColorBlock}
                  keyExtractor={(item) => item}
                  numColumns={3}
                  contentContainerStyle={styles.colorListContainer}
                />
                {/* Cancel button */}
                <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)} activeOpacity={0.7}>
                  <Text style={[styles.closeButtonText, { color: themeColors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SIZES.padding,
    paddingBottom: 80,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(127,86,217,0.08)',
  },
  backButtonText: {
    marginLeft: 10,
    fontSize: 19,
    color: COLORS.primary,
    fontWeight: '700',
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.text,
    letterSpacing: 0.7,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius * 1.4,
    padding: 32,
    marginBottom: 32,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backdropFilter: 'blur(12px)',
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.border,
    marginVertical: 18,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 2,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
    justifyContent: 'center',
    borderRadius: SIZES.profileImageSize / 2,
    overflow: 'hidden',
  },
  profileImage: {
    width: SIZES.profileImageSize,
    height: SIZES.profileImageSize,
    borderRadius: SIZES.profileImageSize / 2,
    backgroundColor: COLORS.placeholder,
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  profileImageOverlay: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    borderRadius: 24,
    padding: 8,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    zIndex: 2,
  },
  colorBlockDisplay: {
    width: SIZES.profileImageSize,
    height: SIZES.profileImageSize,
    borderRadius: SIZES.profileImageSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  profileImagePlaceholder: {
    width: SIZES.profileImageSize,
    height: SIZES.profileImageSize,
    borderRadius: SIZES.profileImageSize / 2,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.placeholder,
  },
  displayName: {
    fontSize: 22,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  formContainer: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: SIZES.borderRadius * 1.1,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginTop: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  icon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    fontSize: 19,
    paddingVertical: 18,
    color: COLORS.text,
    backgroundColor: 'transparent',
    fontWeight: '600',
    borderRadius: SIZES.borderRadius,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 15,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: SIZES.iconSize + 10,
    fontWeight: '600',
  },
  saveButton: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    minHeight: 60,
    width: '100%',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
  },
  savePictureButton: {
    marginTop: 0,
    marginBottom: 22,
    width: '92%',
    alignSelf: 'center',
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 21,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: COLORS.modalBackground,
  },
  modalContainer: {
    width: '100%',
    padding: SIZES.padding,
    paddingBottom: 44,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: SIZES.borderRadius * 2,
    borderTopRightRadius: SIZES.borderRadius * 2,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backdropFilter: 'blur(16px)',
  },
  dragIndicatorOuter: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  dragIndicator: {
    width: 60,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: 17,
    color: COLORS.placeholder,
    marginBottom: 22,
    textAlign: 'center',
  },
  colorListContainer: {
    justifyContent: 'center',
    marginBottom: 22,
  },
  colorBlockSelect: {
    width: SIZES.colorBlockSize,
    height: SIZES.colorBlockSize,
    borderRadius: SIZES.colorBlockSize / 2,
    margin: 12,
    borderWidth: 3,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  colorBlockInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZES.colorBlockSize / 2,
    opacity: 0.15,
    backgroundColor: '#fff',
    zIndex: 0,
  },
  colorBlockInnerSelected: {
    opacity: 0.25,
  },
  colorBlockSelected: {
    borderColor: COLORS.primary,
    borderWidth: 4,
    elevation: 6,
    shadowOpacity: 0.22,
  },
  colorBlockCheckWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.success,
    borderRadius: 16,
    padding: 3,
    zIndex: 2,
  },
  colorBlockCheck: {
    alignSelf: 'center',
  },
  modalButton: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    minHeight: 60,
    marginBottom: 12,
    elevation: 2,
  },
  modalButtonText: {
    color: COLORS.background,
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 0.3,
    zIndex: 2,
  },
  buttonIcon: {
    marginRight: 14,
    zIndex: 2,
  },
  closeButton: {
    backgroundColor: COLORS.border,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 60,
    marginTop: 12,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: 'bold',
  },
});

export default EditProfile;

