import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface LoaderProps {
  colors: {
    text: string;
  };
}

const Loader: React.FC<LoaderProps> = ({ colors }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.text} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loader;
