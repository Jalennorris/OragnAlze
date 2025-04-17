import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  message: string; // The message to display in the empty state
  iconName?: string; // Optional icon name from Ionicons
  iconSize?: number; // Optional size of the icon
  iconColor?: string; // Optional color of the icon
  colors: {
    text: string;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  iconName = 'md-checkmark-circle-outline',
  iconSize = 50,
  iconColor = '#ccc',
  colors = { text: '#000' }, // Default value for colors
}) => {
  return (
    <View style={styles.emptyStateContainer}>
      {iconName && <Ionicons name={iconName} size={iconSize} color={iconColor} />}
      <Text style={[styles.emptyStateText, { color: colors.text || '#000' }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default EmptyState;