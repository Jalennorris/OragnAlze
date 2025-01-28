import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="addTaskScreen"/>
      <Stack.Screen name="taskDetail" />
      <Stack.Screen name="calendarScreen" />
      <Stack.Screen name="login" />
    </Stack>
  );
}