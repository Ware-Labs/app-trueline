import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="register" options={{ headerShown: true, title: 'Sign Up' }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: true, title: 'Forgot Password' }} />
    </Stack>
  );
}
