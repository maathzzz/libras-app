import type { CompleteLessonResponse } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { WeekStreak } from '@/features/streak';
import { spacing } from '@/shared/theme';
import { AppText, Card, Medal, Pill } from '@/shared/ui';

import { streakResultCopy } from './completionView';

type StreakResultCardProps = {
  result: CompleteLessonResponse;
};

// Orange, with "+1 hoje", only when this lesson grew the streak; a second lesson on the
// same day keeps it as it was.
export function StreakResultCard({ result }: StreakResultCardProps) {
  const copy = streakResultCopy(result);

  return (
    <Card tone={result.streakIncreased ? 'warning' : 'default'}>
      <View style={styles.header}>
        <Medal icon="streak" tone="warning" size="md" />
        <View style={styles.text}>
          <AppText variant="subtitle" color={result.streakIncreased ? 'warningDark' : 'text'}>
            {copy.title}
          </AppText>
          {copy.hint && <AppText variant="caption">{copy.hint}</AppText>}
        </View>
        {result.streakIncreased && (
          <Pill label="+1 hoje" icon="streak" tone="warning" accessibilityLabel="Mais 1 dia hoje" />
        )}
      </View>
      <View style={styles.week}>
        <WeekStreak days={result.streak.current} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  text: {
    flex: 1,
    gap: spacing['3xs'],
  },
  week: {
    paddingTop: spacing.xs,
  },
});
