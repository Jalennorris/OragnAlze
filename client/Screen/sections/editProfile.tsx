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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'; // Import manipulator
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  primary: '#6200ee', // Primary theme color
  secondary: '#03dac6', // Secondary theme color
  background: '#fff', // Background color
  error: 'red', // Error message color
  text: '#000', // Default text color
  placeholder: '#ccc', // Placeholder text color
  modalBackground: 'rgba(0, 0, 0, 0.5)', // Semi-transparent modal overlay
};

const SIZES = {
  padding: 20, // Default padding
  borderRadius: 10, // Default border radius
  iconSize: 24, // Size for icons
  profileImageSize: 120, // Size for the main profile image/color block
  colorBlockSize: 80, // Size for the color selection blocks in the modal
};

// Predefined colors for profile picture selection
const colorBlocks = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#F1C40F', '#8E44AD'];

// --- Validation Schema ---
const profileSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
});

// --- Reusable Components ---
const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress}>
    <Icon name="arrow-back" size={SIZES.iconSize} color={COLORS.primary} />
    <Text style={styles.backButtonText}>Back</Text>
  </TouchableOpacity>
);

const ProfileImage = ({ uri, color, onPress }: { uri?: string; color?: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.profileImageContainer}>
    {uri ? (
      <Image source={{ uri: uri }} style={styles.profileImage} onError={(e) => console.log("Failed to load image:", e.nativeEvent.error)} />
    ) : color ? (
      <View style={[styles.colorBlockDisplay, { backgroundColor: color }]} />
    ) : (
      <View style={styles.profileImagePlaceholder}>
        <Icon name="add-a-photo" size={50} color={COLORS.primary} />
      </View>
    )}
  </TouchableOpacity>
);


// --- Main EditProfile Component ---
const EditProfile: React.FC = () => {
  // --- State Variables ---
  // profileImage now stores EITHER a local file URI (if newly selected) OR a public URL (if fetched/uploaded)
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

  const navigation = useNavigation();

  useEffect(() => {
    getUserInfo();
    // loadProfilePreference is less critical now if getUserInfo correctly sets the initial state from DB
    // It might still be useful as a fallback if getUserInfo fails or has no pic initially
    // loadProfilePreference();
  }, []);

  // --- Helper Function ---
  // Checks if a string is a local file URI
  const isLocalFileUri = (uri: string | null): boolean => {
    return !!uri && (uri.startsWith('file://') || uri.startsWith('content://'));
  };


  // --- Async Functions ---

  // Load/Save preference might need adjustment. Now saving the *public URL* or color is more important.
  const loadProfilePreference = async () => {
    try {
      // Preference stored could be a public URL or a color hex
      const savedPreference = await AsyncStorage.getItem('profilePreference');
      if (savedPreference) {
        if (savedPreference.startsWith('#')) {
          setSelectedColor(savedPreference);
          setProfileImage(null);
        } else {
          // Assume it's a URL (could be local URI if saved before upload logic was added)
          setProfileImage(savedPreference);
          setSelectedColor(null);
        }
      }
    } catch (error) {
      console.error('Failed to load profile preference:', error);
    }
  };

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
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch user information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image selection - Sets local file URI to state AFTER RESIZING
  const handleImageUpload = useCallback(async () => {
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (libraryPermission.status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // Pick in highest quality, resize later
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const originalUri = result.assets[0].uri;

      try {
        // Resize the image
        const manipulatedImage = await manipulateAsync(
          originalUri,
          [{ resize: { width: 800 } }], // Resize width to 800px, height adjusts automatically
          { compress: 0.7, format: SaveFormat.JPEG } // Compress and save as JPEG
        );

        const imageUri = manipulatedImage.uri; // Use the URI of the resized image
        setProfileImage(imageUri); // Set the RESIZED local URI
        setSelectedColor(null);
        setIsModalVisible(false);
        // Don't save local URI to preference, wait for successful upload
      } catch (error) {
        console.error("Error resizing image: ", error);
        Alert.alert("Error", "Could not process the selected image.");
      }
    }
  }, [setIsModalVisible, setProfileImage, setSelectedColor]);

  // Handle taking photo - Sets local file URI to state AFTER RESIZING
  const handleTakePhoto = useCallback(async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // Capture in highest quality, resize later
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const originalUri = result.assets[0].uri;

      try {
        // Resize the image
        const manipulatedImage = await manipulateAsync(
          originalUri,
          [{ resize: { width: 800 } }], // Resize width to 800px, height adjusts automatically
          { compress: 0.7, format: SaveFormat.JPEG } // Compress and save as JPEG
        );

        const imageUri = manipulatedImage.uri; // Use the URI of the resized image
        setProfileImage(imageUri); // Set the RESIZED local URI
        setSelectedColor(null);
        setIsModalVisible(false);
        // Don't save local URI to preference, wait for successful upload
      } catch (error) {
        console.error("Error resizing image: ", error);
        Alert.alert("Error", "Could not process the taken photo.");
      }
    }
  }, [setIsModalVisible, setProfileImage, setSelectedColor]);

  // Handle color selection
  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    setProfileImage(null); // Clear any selected image URI/URL
    setIsModalVisible(false);
    // Save color preference immediately (it doesn't need uploading)
    saveProfilePreference(color);
  }, [setIsModalVisible, setProfileImage, setSelectedColor]);

  // *** MODIFIED: Save profile picture (Uploads image or saves color) ***
  const handleSaveProfilePicture = async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      let profilePicValue: string | null = null; // This will hold the value to save (URL or color)
      let response: any; // To store axios response

      // --- Case 1: A new local image was selected (now it's the resized one) ---
      if (isLocalFileUri(profileImage)) {
        console.log("Uploading resized image:", profileImage); // Log the potentially resized URI
        // Create FormData to send the image file

        // Extract filename and type from the potentially manipulated URI
        const uriParts = profileImage.split('/');
        const fileNameWithPotentialQuery = uriParts[uriParts.length - 1];
        // Remove potential query parameters from Expo Manipulator URIs if present
        const fileName = fileNameWithPotentialQuery.split('?')[0];
        // Determine file type - Expo Manipulator often saves as JPEG or PNG
        let fileType = fileName.split('.').pop()?.toLowerCase();
        if (!fileType || !['jpeg', 'jpg', 'png'].includes(fileType)) {
            fileType = 'jpeg'; // Default to jpeg if unsure or format changed
            console.warn("Could not determine file type from URI, defaulting to jpeg");
        }
        const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;

        const formData = new FormData();
        formData.append('profile_pic_file', { // Use a distinct field name for the file
          uri: profileImage,
          name: fileName,
          type: mimeType, // Use determined mime type
        } as any); // Type assertion needed for React Native FormData

        // Add other fields if your backend expects them in the same request
        // formData.append('userId', userId);

        // Make the PATCH request with FormData
        response = await axios.patch(
          `http://localhost:8080/api/users/${userId}`, // *** SUGGESTION: Use a dedicated endpoint for file upload ***
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              // Add any other required headers (like Authorization)
            },
          }
        );

        // --- Backend should return the new public URL ---
        if (response.data && response.data.profile_pic_url) {
           profilePicValue = response.data.profile_pic_url; // Get the URL from response
           console.log("Upload successful, new URL:", profilePicValue);
           // Update state with the *new public URL*
           setProfileImage(profilePicValue);
           setSelectedColor(null); // Ensure color is cleared
        } else {
           throw new Error('Image uploaded, but no URL was returned from the server.');
        }

      }
      // --- Case 2: A color was selected ---
      else if (selectedColor) {
        console.log("Saving selected color:", selectedColor);
        profilePicValue = selectedColor;
        // Send the color hex directly in the JSON payload
        response = await axios.patch(`http://localhost:8080/api/users/${userId}`, {
          profile_pic: profilePicValue, // Send color hex
        });
         // Update state
         setProfileImage(null); // Ensure image is cleared
      }
      // --- Case 3: No change or image is already a URL (Optional: could skip save) ---
      else {
         console.log("No new image or color selected to save.");
         // Optionally, you could still PATCH other data if needed, or just return
         // For this function focused on the picture, we can just show success if nothing changed
         Alert.alert('Info', 'No profile picture change detected.');
         setIsLoading(false);
         return; // Exit early
      }

      // --- Post-Save Updates (if upload/color save happened) ---
      if (profilePicValue !== undefined) { // Check if a value was set (either URL or color)
        // Update credentials state
        setCredentials(prev => ({ ...prev, profilePic: profilePicValue }));
        // Save the final value (URL or color) to AsyncStorage
        await saveProfilePreference(profilePicValue);
        Alert.alert('Success', 'Profile picture updated successfully!');
      }

    } catch (error: any) {
      console.error('Failed to save profile picture:', error);
      let errorMessage = 'Failed to update profile picture. Please try again.';
      if (error.response) {
        // Server responded with a status code outside 2xx range
        console.error("Server Error Data:", error.response.data);
        console.error("Server Error Status:", error.response.status);
        errorMessage = `Server error: ${error.response.data?.message || error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        console.error("Network Error:", error.request);
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Something else happened in setting up the request
        console.error('Error', error.message);
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  // Handle saving the entire form (first name, last name, email)
  // NOTE: This function currently DOES NOT handle image uploads.
  // It sends the current `profilePicValue` (which might be a local URI if not saved yet).
  // For consistency, you might want to:
  // 1. Ensure the picture is saved *first* using handleSaveProfilePicture.
  // 2. OR replicate the image upload logic within this function if a new image was selected.
  // 3. OR modify the backend PATCH /api/users/:userId to also accept multipart/form-data.
  // Approach 1 (saving picture first) is often simpler.
  const handleSaveChanges = async (values: { firstName: string; lastName: string; email: string }) => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found. Please log in again.');

      // ** IMPORTANT: Get the *correct* profile picture value **
      // This should be the public URL or color hex stored in credentials state *after* a successful save/upload.
      const profilePicValue = credentials.profilePic; // Use the value from the main credentials state

      // If a local image URI is still in profileImage state, it means it hasn't been uploaded yet.
      // You should prompt the user to save the picture first, or trigger the upload here.
      if (isLocalFileUri(profileImage)) {
          Alert.alert("Unsaved Picture", "Please save the profile picture before saving other changes.");
          setIsLoading(false);
          return; // Prevent saving other changes until picture is handled
      }


      // Replace with your actual API endpoint for updating user details
      await axios.patch(`http://localhost:8080/api/users/${userId}`, {
        firstname: values.firstName,
        lastname: values.lastName,
        email: values.email,
        // Send the confirmed profile_pic value (URL or color)
        // If profilePicValue is null, the backend should handle it appropriately (e.g., keep existing or set to null)
        profile_pic: profilePicValue,
      });

      // Update local credentials state optimistically
      setCredentials(prev => ({
          ...prev,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          // profilePic is already updated if handleSaveProfilePicture was called
      }));

      Alert.alert('Success', 'Profile updated successfully!');
      // Optionally navigate back or give other feedback
      // navigation.goBack();

    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Functions ---
  const renderColorBlock = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.colorBlockSelect, { backgroundColor: item }]}
      onPress={() => handleColorSelect(item)}
    />
  );

  // --- Main JSX Return ---
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Edit Profile</Text>

          {/* Profile Image Display - uses profileImage state (local URI or public URL) or selectedColor */}
          <ProfileImage
            uri={profileImage ?? undefined}
            color={!profileImage ? selectedColor ?? undefined : undefined} // Show color only if profileImage is null
            onPress={() => setIsModalVisible(true)}
          />

          {credentials.displayName && (
             <Text style={styles.displayName}>@{credentials.displayName}</Text>
          )}

          {/* Save Profile Picture Button */}
          <TouchableOpacity
             style={[styles.saveButton, styles.savePictureButton]}
             onPress={handleSaveProfilePicture}
             // Disable if loading OR if there's no local image/color selected *and* the current state matches the DB state
             disabled={isLoading || (!isLocalFileUri(profileImage) && !selectedColor)}
           >
             {isLoading ? (
               <ActivityIndicator color={COLORS.background} />
             ) : (
               <Text style={styles.saveButtonText}>Save Profile Picture</Text>
             )}
           </TouchableOpacity>

          {/* Profile Picture Selection Modal */}
          <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Choose Profile Picture</Text>
                <Text style={styles.modalSubtitle}>Select a color, upload an image, or take a photo</Text>
                <FlatList
                  data={colorBlocks}
                  renderItem={renderColorBlock}
                  keyExtractor={(item) => item}
                  numColumns={3}
                  contentContainerStyle={styles.colorListContainer}
                />
                <TouchableOpacity style={styles.modalButton} onPress={handleImageUpload}>
                  <Icon name="photo-library" size={SIZES.iconSize} color={COLORS.background} style={styles.buttonIcon} />
                  <Text style={styles.modalButtonText}>Upload from Library</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={handleTakePhoto}>
                  <Icon name="photo-camera" size={SIZES.iconSize} color={COLORS.background} style={styles.buttonIcon} />
                  <Text style={styles.modalButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Formik Form for Profile Details */}
          <Formik
            initialValues={{
                firstName: credentials.firstName,
                lastName: credentials.lastName,
                email: credentials.email
            }}
            validationSchema={profileSchema}
            enableReinitialize // Update form when credentials change
            onSubmit={handleSaveChanges}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Icon name="person-outline" size={SIZES.iconSize} color={COLORS.primary} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor={COLORS.placeholder}
                    value={values.firstName}
                    onChangeText={handleChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    autoCapitalize="words"
                  />
                </View>
                {touched.firstName && errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

                <View style={styles.inputContainer}>
                  <Icon name="person-outline" size={SIZES.iconSize} color={COLORS.primary} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor={COLORS.placeholder}
                    value={values.lastName}
                    onChangeText={handleChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    autoCapitalize="words"
                  />
                </View>
                {touched.lastName && errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

                <View style={styles.inputContainer}>
                  <Icon name="mail-outline" size={SIZES.iconSize} color={COLORS.primary} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={COLORS.placeholder}
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                <TouchableOpacity
                   style={styles.saveButton}
                   onPress={() => handleSubmit()}
                   disabled={isLoading}
                 >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Formik>
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
    paddingBottom: 50,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.text,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  profileImage: {
    width: SIZES.profileImageSize,
    height: SIZES.profileImageSize,
    borderRadius: SIZES.profileImageSize / 2,
    backgroundColor: COLORS.placeholder,
  },
  colorBlockDisplay: {
      width: SIZES.profileImageSize,
      height: SIZES.profileImageSize,
      borderRadius: SIZES.profileImageSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
  },
  profileImagePlaceholder: {
      width: SIZES.profileImageSize,
      height: SIZES.profileImageSize,
      borderRadius: SIZES.profileImageSize / 2,
      backgroundColor: '#e0e0e0',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.placeholder,
  },
  displayName: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.placeholder,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: SIZES.iconSize + 10,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    minHeight: 50,
  },
  savePictureButton: {
    marginTop: 0,
    marginBottom: 30,
    backgroundColor: COLORS.secondary,
    width: '80%',
    alignSelf: 'center',
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingBottom: 30,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.borderRadius * 2,
    borderTopRightRadius: SIZES.borderRadius * 2,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  colorListContainer: {
    justifyContent: 'center',
    marginBottom: 20,
  },
  colorBlockSelect: {
    width: SIZES.colorBlockSize,
    height: SIZES.colorBlockSize,
    borderRadius: SIZES.colorBlockSize / 2,
    margin: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    minHeight: 50,
    marginBottom: 10,
  },
  modalButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
      marginRight: 10,
  },
  closeButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 50,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfile;

