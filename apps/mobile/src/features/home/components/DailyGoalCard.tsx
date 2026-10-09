import type { DailyGoal, StreakStatus } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, ProgressBar } from '@/shared/ui';

import { dailyGoalHint, lessonsLabel } from './homeCopy';

type DailyGoalCardProps = {
  goal: DailyGoal;
  streakStatus: StreakStatus;
  hasStarted: boolean;
};

export function DailyGoalCard({ goal, streakStatus, hasStarted }: DailyGoalCardProps) {
  const { completedToday, target } = goal;

  return (
    <Card>
      <View style={styles.header}>
        <AppText variant="bodyStrong">Meta diária</AppText>
        <AppText variant="caption">{`${completedToday} de ${lessonsLabel(target)}`}</AppText>
      </View>
      <ProgressBar value={completedToday / target} accessibilityLabel="Meta diária" />
      <AppText variant="caption">{dailyGoalHint(streakStatus, hasStarted)}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
});
