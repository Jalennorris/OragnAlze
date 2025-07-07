import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../app/index';
import DetailsScreen from '../Screen/taskDetail';
import PrivacyPolicy from '../Screen/sections/PrivacyPolicy'; // Import the new screen

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="sections/privacyPolicy"
        component={PrivacyPolicy}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
