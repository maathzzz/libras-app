import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { restoreSession, useAuthStatus } from '@/features/auth';
import { useSyncPendingSessions } from '@/features/lesson';
import { useProfileSession } from '@/features/profile';
import { useStreakReminder } from '@/features/reminder';
import { useAppFonts } from '@/shared/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const authStatus = useAuthStatus();
  const ready = (fontsLoaded || fontError !== null) && authStatus !== 'restoring';
  const signedIn = authStatus === 'signedIn';
  useSyncPendingSessions();
  useProfileSession();
  useStreakReminder();

  useEffect(() => {
    void restoreSession();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Flipping a guard swaps the whole area: signing in or out needs no navigation. */}
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="module/[unitId]" />
          <Stack.Screen name="lesson/[lessonId]" options={{ presentation: 'fullScreenModal' }} />
          {/* No swipe back: the lesson it came from was already replaced. */}
          <Stack.Screen
            name="lesson/complete"
            options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
          />
          <Stack.Screen name="study/[studyId]" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="settings" />
          <Stack.Screen name="daily-goal" />
          <Stack.Screen name="reminder-time" />
          {/* On the root stack so the sheet covers the tab bar and reaches the screen edge. */}
          <Stack.Screen
            name="hand-sign/[signId]"
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
        </Stack.Protected>
        {/* The saved session is restored before this renders (the splash stays up meanwhile), so
            a signed-in learner never sees the welcome screen flash. */}
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
