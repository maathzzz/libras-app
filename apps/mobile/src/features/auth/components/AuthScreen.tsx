import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { haptics } from '@/shared/lib/haptics';
import { colors, spacing } from '@/shared/theme';
import { AppText, Button, ScreenTitle } from '@/shared/ui';

import { useAuthStore } from '../store/authStore';

type AuthScreenProps = {
  title: string;
  description: string;
  /** The primary button; it is disabled while an auth call is running. */
  action: string;
  busyAction: string;
  onAction: () => void;
  /** Defaults to going back one screen. */
  onBack?: () => void;
  children: ReactNode;
};

// Same layout as the onboarding steps: title, fields, then the actions at the bottom.
export function AuthScreen({
  title,
  description,
  action,
  busyAction,
  onAction,
  onBack = () => router.back(),
  children,
}: AuthScreenProps) {
  const submitting = useAuthStore((state) => state.submitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  // The error is shared by every auth screen: one screen's failure must not show on the next.
  useEffect(() => {
    clearError();
    return clearError;
  }, [clearError]);

  // Felt as well as seen: deaf learners get no sound cue.
  useEffect(() => {
    if (error) void haptics.wrong();
  }, [error]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenTitle title={title} description={description} />
        {children}
        {error && (
          <View accessibilityRole="alert" accessibilityLiveRegion="polite">
            <AppText variant="bodyStrong" color="danger" align="center">
              {error}
            </AppText>
          </View>
        )}
      </ScrollView>
      <View style={styles.actions}>
        <Button label={submitting ? busyAction : action} onPress={onAction} disabled={submitting} />
        <Button label="Voltar" variant="ghost" onPress={onBack} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing['3xl'],
    paddingTop: spacing.sm,
    paddingHorizontal: spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
});
