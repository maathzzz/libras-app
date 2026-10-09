import type { TodayProgress } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Card, Icon, ProgressBar } from '@/shared/ui';

import { todayGoalCopy } from './homeView';

type TodayGoalCardProps = {
  today: TodayProgress;
};

export function TodayGoalCard({ today }: TodayGoalCardProps) {
  const copy = todayGoalCopy(today);

  return (
    <Card>
      <View style={styles.header}>
        <Icon name="goal" color="accent" />
        <AppText variant="subtitle" accessibilityRole="header">
          Meta de hoje
        </AppText>
        <View style={styles.spacer} />
        <AppText variant="bodyStrong" color="accent">
          {copy.progress}
        </AppText>
      </View>
      <ProgressBar value={copy.ratio} accessibilityLabel={`Meta de hoje: ${copy.progress}`} />
      <AppText variant="caption">{copy.hint}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
});
