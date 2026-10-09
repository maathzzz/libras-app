import type { DailyGoal } from '@libras/contracts';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { AppText, Button, ScreenTitle } from '@/shared/ui';

import { useProfileStore } from '../store/profileStore';
import { DailyGoalOptions } from './DailyGoalOptions';

// Opened from the settings; the onboarding has its own step with the same options.
export function DailyGoalScreen() {
  const current = useProfileStore((state) => state.profile?.dailyGoal);
  const saving = useProfileStore((state) => state.saving);
  const update = useProfileStore((state) => state.update);
  const [goal, setGoal] = useState<DailyGoal>(current ?? 3);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    if (goal === current) {
      router.back();
      return;
    }
    setFailed(false);
    if (await update({ dailyGoal: goal })) {
      router.back();
    } else {
      setFailed(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle
          title="Qual é a sua meta diária?"
          description="Quantas lições você quer fazer por dia. Uma lição já mantém sua sequência."
        />
        <DailyGoalOptions value={goal} onChange={setGoal} />
      </ScrollView>
      <View style={styles.actions}>
        {failed && (
          <AppText variant="caption" color="danger" align="center">
            Não foi possível salvar. Verifique sua conexão e tente de novo.
          </AppText>
        )}
        <Button label={saving ? 'Salvando…' : 'Salvar'} onPress={save} disabled={saving} />
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
