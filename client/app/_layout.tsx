import { Stack } from "expo-router";
import React, { useState, useEffect } from 'react';
import LoadingPage from './LoadingPage'; // Ensure this path is correct

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate a 1-second loading time

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="addTaskScreen" />
      <Stack.Screen name="taskDetail" />
      <Stack.Screen name="calendarScreen" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="settings" />

      {/* Settings sections */}
      <Stack.Screen name="sections/editProfile" />
      <Stack.Screen name="sections/changePassword" />
      <Stack.Screen name="sections/updateEmail" />
    </Stack>
  );
}