import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
  colors: { text: string };
}

const ErrorState: React.FC<ErrorStateProps> = ({ errorMessage, onRetry, colors }) => {
  return (
    <View style={styles.errorContainer}>
      <Text style={[styles.errorText, { color: colors.text }]}>{errorMessage}</Text>
      <TouchableOpacity onPress={onRetry}>
        <Text style={[styles.retryText, { color: colors.text }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
  },
  retryText: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default ErrorState;
