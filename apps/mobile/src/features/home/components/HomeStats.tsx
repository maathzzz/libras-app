import type { HomeResponse } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { StreakBadge } from '@/features/streak';
import { spacing } from '@/shared/theme';
import { Pill } from '@/shared/ui';

import { formatXp } from './homeView';

type HomeStatsProps = Pick<HomeResponse, 'streak' | 'totalXp'>;

export function HomeStats({ streak, totalXp }: HomeStatsProps) {
  const xp = formatXp(totalXp);

  return (
    <View style={styles.row}>
      <StreakBadge days={streak.current} />
      <Pill label={xp} icon="xp" accessibilityLabel={`${xp} XP`} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
