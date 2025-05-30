import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PasswordInputProps {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry: boolean;
  isPasswordVisible: boolean;
  onToggleVisibility: () => void;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  isPasswordVisible,
  onToggleVisibility,
}) => (
  <View style={styles.inputContainer}>
    <Icon name={icon} size={24} color="#6200ee" style={styles.icon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
      accessibilityLabel={`Enter your ${placeholder.toLowerCase()}`}
      accessible
    />
    <TouchableOpacity
      onPress={onToggleVisibility}
      style={styles.visibilityIcon}
      accessibilityLabel={isPasswordVisible ? `Hide ${placeholder.toLowerCase()}` : `Show ${placeholder.toLowerCase()}`}
      accessible
      accessibilityRole="button"
    >
      <Icon name={isPasswordVisible ? "visibility" : "visibility-off"} size={22} color="#888" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
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
});

export default PasswordInput;
