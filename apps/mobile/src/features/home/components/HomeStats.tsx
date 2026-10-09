import type { HomeResponse } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { StreakBadge } from '@/features/streak';
import { spacing } from '@/shared/theme';
import { Pill } from '@/shared/ui';

import { formatXp, lessonsLabel } from './homeCopy';

type HomeStatsProps = Pick<HomeResponse, 'streak' | 'totalXp' | 'dailyGoal'>;

export function HomeStats({ streak, totalXp, dailyGoal }: HomeStatsProps) {
  const xp = formatXp(totalXp);
  const { completedToday, target } = dailyGoal;

  return (
    <View style={styles.row}>
      <StreakBadge days={streak.current} />
      <Pill label={xp} icon="xp" accessibilityLabel={`${xp} XP`} />
      <View style={styles.spacer} />
      <Pill
        label={`${completedToday}/${target}`}
        icon="goal"
        tone="info"
        accessibilityLabel={`${completedToday} de ${lessonsLabel(target)} hoje`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
});
