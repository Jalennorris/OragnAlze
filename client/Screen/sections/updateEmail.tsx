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
import { LinearGradient } from 'expo-linear-gradient';

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Back button"
            accessibilityHint="Navigates to the previous screen"
            accessibilityRole="button"
          >
            <Icon name="arrow-back" size={SIZES.iconSize} color={COLORS.primary} />
            <Text style={[styles.backButtonText, { color: COLORS.primary }]}>Back</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: COLORS.text }]}>{t('update_email')}</Text>

          <View style={styles.card}>
            <Formik
              initialValues={{ currentEmail: '', newEmail: '', confirmEmail: '' }}
              validationSchema={emailSchema}
              onSubmit={handleSave}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Icon name="email" size={SIZES.iconSize} color={COLORS.primary} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('current_email')}
                      placeholderTextColor={COLORS.placeholder}
                      value={values.currentEmail}
                      onChangeText={handleChange('currentEmail')}
                      onBlur={handleBlur('currentEmail')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                      accessibilityLabel={t('current_email')}
                      accessibilityHint={t('enter_current_email')}
                    />
                  </View>
                  {touched.currentEmail && errors.currentEmail && (
                    <Text style={styles.errorText}>{t(errors.currentEmail)}</Text>
                  )}
                  <View style={styles.inputContainer}>
                    <Icon name="email" size={SIZES.iconSize} color={COLORS.primary} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('new_email')}
                      placeholderTextColor={COLORS.placeholder}
                      value={values.newEmail}
                      onChangeText={handleChange('newEmail')}
                      onBlur={handleBlur('newEmail')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                      accessibilityLabel={t('new_email')}
                      accessibilityHint={t('enter_new_email')}
                    />
                  </View>
                  {touched.newEmail && errors.newEmail && (
                    <Text style={styles.errorText}>{t(errors.newEmail)}</Text>
                  )}
                  <View style={styles.inputContainer}>
                    <Icon name="email" size={SIZES.iconSize} color={COLORS.primary} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('confirm_new_email')}
                      placeholderTextColor={COLORS.placeholder}
                      value={values.confirmEmail}
                      onChangeText={handleChange('confirmEmail')}
                      onBlur={handleBlur('confirmEmail')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                      accessibilityLabel={t('confirm_new_email')}
                      accessibilityHint={t('reenter_new_email')}
                    />
                  </View>
                  {touched.confirmEmail && errors.confirmEmail && (
                    <Text style={styles.errorText}>{t(errors.confirmEmail)}</Text>
                  )}

                  <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={() => handleSubmit()}
                    disabled={isLoading}
                    activeOpacity={0.7}
                    accessibilityLabel={t('save_email_changes')}
                    accessibilityHint={t('saves_new_email')}
                    accessibilityRole="button"
                  >
                    <LinearGradient
                      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>{t('save_changes')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SIZES.padding,
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
  formContainer: {
    width: '100%',
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
});

export default UpdateEmail;