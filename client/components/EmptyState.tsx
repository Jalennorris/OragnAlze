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
    background?: string; // Optional background color
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  iconName = 'md-checkmark-circle-outline',
  iconSize = 50,
  iconColor = '#ccc',
  colors = { text: '#000', background: '#fff' }, // Default value for colors
}) => {
  return (
    <View
      style={[
        styles.emptyStateContainer,
        { backgroundColor: colors.background || '#fff' },
      ]}
      accessibilityLabel="Empty state message"
      accessibilityRole="text"
    >
      <Ionicons
        name={iconName}
        size={iconSize}
        color={iconColor}
        style={styles.icon}
      />
      <Text
        style={[styles.emptyStateText, { color: colors.text || '#000' }]}
      >
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
    padding: 20, // Add padding for better spacing
    borderRadius: 10, // Add rounded corners for aesthetics
  },
  icon: {
    marginBottom: 10, // Spacing between icon and text
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10, // Add spacing between the icon and the text
  },
});

export default EmptyState;