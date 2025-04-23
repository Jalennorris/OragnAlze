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
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Credentials {
  firstName: string;
  lastName: string;
  email: string;
  profilePic: string;
  displayName: string;
}

// Constants
const COLORS = {
  primary: '#6200ee',
  secondary: '#03dac6',
  background: '#fff',
  error: 'red',
  text: '#000',
  placeholder: '#ccc',
};

const SIZES = {
  padding: 20,
  borderRadius: 10,
  iconSize: 24,
  profileImageSize: 120,
  colorBlockSize: 100,
};

const colorBlocks = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#F1C40F', '#8E44AD'];

// Validation schema
const profileSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
});

// Reusable Components
const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress}>
    <Icon name="arrow-back" size={SIZES.iconSize} color={COLORS.primary} />
    <Text style={styles.backButtonText}>Back</Text>
  </TouchableOpacity>
);

const ProfileImage = ({ uri, color, onPress }: { uri?: string; color?: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.profileImageContainer}>
    {uri ? (
      <Image source={{ uri: uri }} style={styles.profileImage} />
    ) : color ? (
      <View style={[styles.colorBlock, { backgroundColor: color, width: SIZES.profileImageSize, height: SIZES.profileImageSize, borderRadius: SIZES.profileImageSize / 2 }]} />
    ) : (
      <Icon name="add-a-photo" size={50} color={COLORS.primary} />
    )}
  </TouchableOpacity>
);

const EditProfile: React.FC<{ }> = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [credentials, setCredentials] = useState<Credentials>({
    firstName: '',
    lastName: '',
    email: '',
    profilePic: '',
    displayName: '',
  });

  const navigation = useNavigation();

  useEffect(() => {
    getUserInfo();
    loadProfileImage(); // Load the saved profile image on component mount
  }, []);

  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('profileImage');
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Failed to load profile image:', error);
    }
  };

  const handleImageUpload = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      setSelectedColor(null);
      setIsModalVisible(false);

      try {
        await AsyncStorage.setItem('profileImage', imageUri); // Save the selected image URI
      } catch (error) {
        console.error('Failed to save profile image:', error);
      }
    }
  }, []);

  const getUserInfo = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId'); // Retrieve userId from AsyncStorage
      if (!userId) throw new Error('User ID not found');

      const response = await axios.get(`http://localhost:8080/api/users/${userId}`);
      const data = response.data;

      setCredentials({
        firstName: data.firstname,
        lastName: data.lastname,
        email: data.email,
        profilePic: data.profile_pic,
        displayName: data.username // Use the username as the display name
      });
      console.log('display name:', data.username);
      console.log('profile_pic:', data.profile_pic);
      console.log(data);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const handleSave = async (values: { firstName: string; lastName: string; email: string }) => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId'); // Retrieve userId from AsyncStorage
      if (!userId) throw new Error('User ID not found');

      await axios.patch(`http://localhost:8080/api/users/${userId}`, {
        firstname: values.firstName,
        lastname: values.lastName,
        email: values.email,
        profile_pic: profileImage || selectedColor,
      });

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfilePicture = async () => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId'); // Retrieve userId from AsyncStorage
      if (!userId) throw new Error('User ID not found');

      await axios.patch(`http://localhost:8080/api/users/${userId}`, {
        profile_pic: profileImage || selectedColor,
      });

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderColorBlock = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.colorBlock, { backgroundColor: item }]}
      onPress={() => {
        setSelectedColor(item);
        setProfileImage(null);
        setIsModalVisible(false);
      }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Edit Profile</Text>

          <ProfileImage 
            uri={profileImage ? profileImage : undefined} 
            color={!profileImage && selectedColor ? selectedColor : undefined} 
            onPress={() => setIsModalVisible(true)} 
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfilePicture} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Profile Picture</Text>}
          </TouchableOpacity>

          <Modal visible={isModalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Choose a Profile Picture</Text>
                <Text style={styles.modalSubtitle}>Select a color or upload an image</Text>
                <FlatList
                  data={colorBlocks}
                  renderItem={renderColorBlock}
                  keyExtractor={(item, index) => index.toString()}
                  numColumns={3}
                />
                <TouchableOpacity style={styles.uploadButton} onPress={handleImageUpload}>
                  <Text style={styles.uploadButtonText}>Upload from Camera Roll</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Formik
            initialValues={credentials}
            validationSchema={profileSchema}
            enableReinitialize
            onSubmit={handleSave}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Icon name="person" size={SIZES.iconSize} color={COLORS.primary} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={credentials.firstName || "First Name"}
                    value={values.firstName}
                    onChangeText={handleChange('firstName')}
                    onBlur={handleBlur('firstName')}
                  />
                </View>
                {touched.firstName && errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

                <View style={styles.inputContainer}>
                  <Icon name="person" size={SIZES.iconSize} color={COLORS.primary} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={credentials.lastName || "Last Name"}
                    value={values.lastName}
                    onChangeText={handleChange('lastName')}
                    onBlur={handleBlur('lastName')}
                  />
                </View>
                {touched.lastName && errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

                <View style={styles.inputContainer}>
                  <Icon name="email" size={SIZES.iconSize} color={COLORS.primary} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={credentials.email || "Email"}
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    keyboardType="email-address"
                  />
                </View>
                {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                <TouchableOpacity style={styles.saveButton} onPress={() => handleSubmit()} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SIZES.padding,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 18,
    color: COLORS.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: SIZES.profileImageSize,
    height: SIZES.profileImageSize,
    borderRadius: SIZES.profileImageSize / 2,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.placeholder,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 10,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadius,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  colorBlock: {
    width: SIZES.colorBlockSize,
    height: SIZES.colorBlockSize,
    borderRadius: SIZES.colorBlockSize / 2,
    margin: 10,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    marginTop: 20,
  },
  uploadButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: COLORS.placeholder,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 18,
  },
});

export default EditProfile;