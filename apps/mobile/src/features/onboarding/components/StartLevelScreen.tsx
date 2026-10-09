import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { OptionRow } from '@/shared/ui';

import { startLevelOptions } from '../content/startLevels';
import { useOnboardingStore } from '../store/onboardingStore';
import { OnboardingStep } from './OnboardingStep';

export function StartLevelScreen() {
  const startLevel = useOnboardingStore((state) => state.startLevel);
  const setStartLevel = useOnboardingStore((state) => state.setStartLevel);

  return (
    <OnboardingStep
      step={2}
      title="Qual é o seu nível?"
      description="Define por onde sua trilha começa."
      action="Continuar"
      onContinue={() => router.push('/daily-goal-step')}
    >
      <View style={styles.list} accessibilityRole="radiogroup">
        {startLevelOptions.map((option) => (
          <OptionRow
            key={option.level}
            title={option.title}
            description={option.description}
            tag={option.tag}
            leading={{ icon: option.icon }}
            selected={option.level === startLevel}
            onPress={() => setStartLevel(option.level)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
