import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { colors, spacing } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

// Route params arrive as strings and can be edited through a deep link.
const LessonScore = z.object({
  correct: z.coerce.number().int().nonnegative(),
  total: z.coerce.number().int().positive(),
});

// Placeholder until the reward screen: it will show the XP and streak returned by the BFF.
export function LessonCompleteScreen() {
  const params = useLocalSearchParams();
  const score = LessonScore.safeParse(params);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <AppText variant="title" align="center" accessibilityRole="header">
          Lição concluída!
        </AppText>
        {score.success && (
          <AppText variant="body" color="textMuted" align="center">
            {`Você acertou ${score.data.correct} de ${score.data.total}.`}
          </AppText>
        )}
      </View>
      <Button label="Voltar à trilha" onPress={() => router.dismissTo('/')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: spacing['2xl'],
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
});
