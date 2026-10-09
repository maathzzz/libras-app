import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { Button, ScreenTitle } from '@/shared/ui';

// Account, level and daily goal: the welcome screen comes before and is not counted.
export const onboardingSteps = 3;

type OnboardingStepProps = {
  step: number;
  title: string;
  description: string;
  action: string;
  onContinue: () => void;
  busy?: boolean;
  children: ReactNode;
};

export function OnboardingStep({
  step,
  title,
  description,
  action,
  onContinue,
  busy = false,
  children,
}: OnboardingStepProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          kicker={`Passo ${step} de ${onboardingSteps}`}
          title={title}
          description={description}
        />
        {children}
      </ScrollView>
      <View style={styles.actions}>
        <Button label={action} onPress={onContinue} disabled={busy} />
        <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
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
