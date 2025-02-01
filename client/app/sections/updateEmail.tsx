import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';

// Validation schema
const emailSchema = Yup.object().shape({
  currentEmail: Yup.string().email('Invalid email').required('Current email is required'),
  newEmail: Yup.string().email('Invalid email').required('New email is required'),
  confirmEmail: Yup.string()
    .oneOf([Yup.ref('newEmail'), null], 'Emails must match')
    .required('Confirm email is required'),
});

const UpdateEmail: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  // Handle form submission
  const handleSave = async (values: { currentEmail: string; newEmail: string; confirmEmail: string }) => {
    setIsLoading(true);
    try {
      // Simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert('Success', 'Email updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#6200ee" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Update Email</Text>

        {/* Form */}
        <Formik
          initialValues={{ currentEmail: '', newEmail: '', confirmEmail: '' }}
          validationSchema={emailSchema}
          onSubmit={handleSave}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              {/* Current Email Input */}
              <View style={styles.inputContainer}>
                <Icon name="email" size={24} color="#6200ee" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Current Email"
                  value={values.currentEmail}
                  onChangeText={handleChange('currentEmail')}
                  onBlur={handleBlur('currentEmail')}
                  keyboardType="email-address"
                />
              </View>
              {touched.currentEmail && errors.currentEmail && (
                <Text style={styles.errorText}>{errors.currentEmail}</Text>
              )}

              {/* New Email Input */}
              <View style={styles.inputContainer}>
                <Icon name="email" size={24} color="#6200ee" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="New Email"
                  value={values.newEmail}
                  onChangeText={handleChange('newEmail')}
                  onBlur={handleBlur('newEmail')}
                  keyboardType="email-address"
                />
              </View>
              {touched.newEmail && errors.newEmail && (
                <Text style={styles.errorText}>{errors.newEmail}</Text>
              )}

              {/* Confirm Email Input */}
              <View style={styles.inputContainer}>
                <Icon name="email" size={24} color="#6200ee" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Email"
                  value={values.confirmEmail}
                  onChangeText={handleChange('confirmEmail')}
                  onBlur={handleBlur('confirmEmail')}
                  keyboardType="email-address"
                />
              </View>
              {touched.confirmEmail && errors.confirmEmail && (
                <Text style={styles.errorText}>{errors.confirmEmail}</Text>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSubmit()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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