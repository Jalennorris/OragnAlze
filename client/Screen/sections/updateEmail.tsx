import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// Validation schema
const emailSchema = Yup.object().shape({
  currentEmail: Yup.string()
    .email('Please enter a valid email address')
    .required('Current email is required'),
  newEmail: Yup.string()
    .email('Please enter a valid email address')
    .required('New email is required'),
  confirmEmail: Yup.string()
    .oneOf([Yup.ref('newEmail'), null], 'Emails must match')
    .required('Confirm email is required'),
});

// Reusable EmailInput component with React.memo and error highlight
const EmailInput: React.FC<{
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  error?: string;
  editable?: boolean;
  accessibilityLabel: string;
  accessibilityHint: string;
  colors: any;
}> = React.memo(({
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  editable = true,
  accessibilityLabel,
  accessibilityHint,
  colors,
}) => (
  <>
    <View
      style={[
        styles.inputContainer,
        { borderBottomColor: error ? colors.notification : colors.border },
      ]}
    >
      <Icon name="email" size={24} color={colors.primary} style={styles.icon} />
      <TextInput
        style={[
          styles.input,
          { color: colors.text },
          error && { borderColor: colors.notification },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={editable}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      />
    </View>
    {error && <Text style={[styles.errorText, { color: colors.notification }]}>{error}</Text>}
  </>
));

// Memoized BackButton for performance
const BackButton = React.memo(({ onPress, colors }: { onPress: () => void; colors: any }) => (
  <TouchableOpacity
    style={styles.backButton}
    onPress={onPress}
    accessibilityLabel="Back button"
    accessibilityHint="Navigates to the previous screen"
    accessibilityRole="button"
  >
    <Icon name="arrow-back" size={24} color={colors.primary} />
    <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
  </TouchableOpacity>
));

const MAX_RETRIES = 2;

const UpdateEmail: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Retry logic for PATCH request
  const patchWithRetry = useCallback(async (url: string, data: any, retries = MAX_RETRIES) => {
    let lastError;
    for (let i = 0; i <= retries; i++) {
      try {
        return await axios.patch(url, data);
      } catch (error) {
        lastError = error;
        if (i === retries) throw error;
      }
    }
    throw lastError;
  }, []);

  // Handle form submission
  const handleSave = async (values: { currentEmail: string; newEmail: string; confirmEmail: string }) => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      await patchWithRetry(
        `http://localhost:8080/api/users/${userId}/update-email`,
        { currentEmail: values.currentEmail, newEmail: values.newEmail }
      );
      Alert.alert(t('success'), t('email_updated_successfully'), [
        {
          text: t('ok'),
          onPress: () => navigation.replace('Home'),
        },
      ]);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        (error?.message?.includes('Network') ? t('network_error') : t('something_went_wrong'));
      Alert.alert(t('error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Memoized Back Button */}
          <BackButton onPress={() => navigation.goBack()} colors={colors} />

          <Text style={[styles.title, { color: colors.text }]}>{t('update_email')}</Text>

          {/* Form */}
          <Formik
            initialValues={{ currentEmail: '', newEmail: '', confirmEmail: '' }}
            validationSchema={emailSchema}
            onSubmit={handleSave}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.formContainer}>
                <EmailInput
                  placeholder={t('current_email')}
                  value={values.currentEmail}
                  onChangeText={handleChange('currentEmail')}
                  onBlur={handleBlur('currentEmail')}
                  error={touched.currentEmail && errors.currentEmail ? t(errors.currentEmail) : undefined}
                  editable={!isLoading}
                  accessibilityLabel={t('current_email')}
                  accessibilityHint={t('enter_current_email')}
                  colors={colors}
                />
                <EmailInput
                  placeholder={t('new_email')}
                  value={values.newEmail}
                  onChangeText={handleChange('newEmail')}
                  onBlur={handleBlur('newEmail')}
                  error={touched.newEmail && errors.newEmail ? t(errors.newEmail) : undefined}
                  editable={!isLoading}
                  accessibilityLabel={t('new_email')}
                  accessibilityHint={t('enter_new_email')}
                  colors={colors}
                />
                <EmailInput
                  placeholder={t('confirm_new_email')}
                  value={values.confirmEmail}
                  onChangeText={handleChange('confirmEmail')}
                  onBlur={handleBlur('confirmEmail')}
                  error={touched.confirmEmail && errors.confirmEmail ? t(errors.confirmEmail) : undefined}
                  editable={!isLoading}
                  accessibilityLabel={t('confirm_new_email')}
                  accessibilityHint={t('reenter_new_email')}
                  colors={colors}
                />

                {/* Save Button */}
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: isLoading ? colors.border : colors.primary },
                  ]}
                  onPress={() => handleSubmit()}
                  disabled={isLoading}
                  accessibilityLabel={t('save_email_changes')}
                  accessibilityHint={t('saves_new_email')}
                  accessibilityRole="button"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('save_changes')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Formik>
          {/* Example placeholder for empty profile picture */}
          {/* {!profileImage && !profileColor && (
            <View style={styles.placeholderContainer}>
              <Text style={{ color: colors.text }}>No profile picture selected.</Text>
            </View>
          )} */}
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
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
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
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
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
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

export default UpdateEmail;