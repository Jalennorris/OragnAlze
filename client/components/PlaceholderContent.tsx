import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PlaceholderContentProps {
  isLoading: boolean;
  numDays: number;
  errorMessage: string | null;
  styles: any;
}

const PlaceholderContent: React.FC<PlaceholderContentProps> = ({
  isLoading,
  numDays,
  errorMessage,
  styles,
}) => {
  if (isLoading) {
    return (
      <View style={styles.placeholderContainer}>
        <ActivityIndicator size="large" color="#BB86FC" />
        <Text style={styles.placeholderText}>Generating your {numDays}-day plan...</Text>
      </View>
    );
  }
  return (
    <View style={styles.placeholderContainer}>
      <Ionicons name="bulb-outline" size={40} color="#888" style={{ marginBottom: 10 }} />
      <Text style={styles.placeholderText}>
        {errorMessage ? errorMessage : `Describe your goal below to get a personalized ${numDays}-day task plan.`}
      </Text>
    </View>
  );
};

export default PlaceholderContent;
