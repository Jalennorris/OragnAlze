import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import the reusable PasswordInput component
import PasswordInput from '../../components/PasswordInput';

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigation = useNavigation();

  // Form validation with password strength
  const validateForm = (): boolean => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill out all fields.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match.');
      return false;
    }
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      Alert.alert(
        'Error',
        'Password must be at least 8 characters long and include at least one uppercase letter and one number.'
      );
      return false;
    }
    return true;
  };

  // Save button enabled only if form is valid
  const isFormValid =
    !!currentPassword &&
    !!newPassword &&
    !!confirmPassword &&
    newPassword === confirmPassword &&
    /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword);

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.patch(
        `http://localhost:8080/api/users/${userId}/change-password`,
        { currentPassword, newPassword }
      );
      Alert.alert(
        'Success',
        'Password updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Network error. Please check your internet connection and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Full-screen loading indicator */}
      {isSaving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      )}
      <View style={styles.container} pointerEvents={isSaving ? 'none' : 'auto'}>
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
          secureTextEntry={!showCurrent}
          isPasswordVisible={showCurrent}
          onToggleVisibility={() => setShowCurrent(v => !v)}
        />

        <PasswordInput
          icon="lock"
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNew}
          isPasswordVisible={showNew}
          onToggleVisibility={() => setShowNew(v => !v)}
        />

        <PasswordInput
          icon="lock"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
          isPasswordVisible={showConfirm}
          onToggleVisibility={() => setShowConfirm(v => !v)}
        />

        <TouchableOpacity
          style={[styles.saveButton, (!isFormValid || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isFormValid || isSaving}
          accessibilityLabel="Save password changes"
          accessibilityRole="button"
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

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
  visibilityIcon: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#aaa',
  },
  // Full-screen loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default ChangePassword;