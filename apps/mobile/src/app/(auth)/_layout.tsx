import { Stack } from 'expo-router';

// Signed-out visitors land on the welcome screen, also after signing out.
export const unstable_settings = {
  initialRouteName: 'welcome',
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
