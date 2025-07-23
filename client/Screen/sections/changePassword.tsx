import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PasswordInput from '../../components/PasswordInput';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#7F56D9',
  secondary: '#38BDF8',
  background: '#F3F4F6',
  error: '#EF4444',
  text: '#0F172A',
  placeholder: '#94A3B8',
  card: 'rgba(255,255,255,0.85)',
  border: '#E5E7EB',
  shadow: '#7F56D933',
  gradientStart: '#7F56D9',
  gradientEnd: '#38BDF8',
};

const SIZES = {
  padding: 28,
  borderRadius: 28,
  iconSize: 32,
};

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password.');
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
      await axios.patch(
        `http://localhost:8080/api/users/${userId}/change-password`,
        { currentPassword, newPassword }
      );
      Alert.alert(
        'Success',
        'Password updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      // Debug log
      console.log('Change password error:', error.response);

      const backendMsg = error.response?.data?.message;
      if (
        error.response?.status === 401 ||
        (typeof backendMsg === 'string' && backendMsg.toLowerCase().includes('current password'))
      ) {
        Alert.alert('Error', 'The current password you entered is incorrect.');
      } else if (backendMsg) {
        Alert.alert('Error', backendMsg);
      } else {
        Alert.alert(
          'Error',
          'Network error. Please check your internet connection and try again.'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isSaving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
      <View style={styles.container} pointerEvents={isSaving ? 'none' : 'auto'}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-back" size={SIZES.iconSize} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={styles.card}>
          <PasswordInput
            icon="lock"
            placeholder="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            isPasswordVisible={showCurrent}
            onToggleVisibility={() => setShowCurrent(v => !v)}
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            iconStyle={styles.icon}
          />
          <PasswordInput
            icon="lock"
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            isPasswordVisible={showNew}
            onToggleVisibility={() => setShowNew(v => !v)}
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            iconStyle={styles.icon}
          />
          <PasswordInput
            icon="lock"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            isPasswordVisible={showConfirm}
            onToggleVisibility={() => setShowConfirm(v => !v)}
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            iconStyle={styles.icon}
          />
          <TouchableOpacity
            style={[styles.saveButton, (!isFormValid || isSaving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isFormValid || isSaving}
            activeOpacity={0.7}
            accessibilityLabel="Save password changes"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
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
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 28,
    textAlign: 'center',
    color: COLORS.text,
    letterSpacing: 0.7,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius * 1.2,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: SIZES.borderRadius * 1.1,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginTop: 10,
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
  saveButton: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 60,
    width: '100%',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 21,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    zIndex: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default ChangePassword;