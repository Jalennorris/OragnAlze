import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const navigation = useNavigation();

  const validateForm = (): boolean => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill out all fields.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match.');
      return false;
    }
    if (newPassword.length < 1) {
      Alert.alert('Error', 'New password must be at least 8 characters long.');
      return false;
    }
    return true;
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
  
    try {
      const userId = localStorage.getItem('userId');
  
      const response = await axios.patch(
        `http://localhost:8080/api/users/${userId}/change-password`,
        { currentPassword, newPassword }
      );
  
      console.log('Password updated successfully:', response.data);
  
      // Debugging: Check if success alert is being called
      console.log('Showing success alert');
      Alert.alert('Success', 'Password updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating password:', error);
  
      // Debugging: Check if error alert is being called
      console.log('Showing error alert');
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update password. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#6200ee" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Change Password</Text>

        <PasswordInput
          icon="lock"
          placeholder="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <PasswordInput
          icon="lock"
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <PasswordInput
          icon="lock"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const PasswordInput: React.FC<{
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}> = ({ icon, placeholder, value, onChangeText }) => (
  <View style={styles.inputContainer}>
    <Icon name={icon} size={24} color="#6200ee" style={styles.icon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry
    />
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ChangePassword;