import type { DailyGoal } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { OptionRow } from '@/shared/ui';

import { dailyGoalLabel, dailyGoalOptions } from '../content/dailyGoals';

type DailyGoalOptionsProps = {
  value: DailyGoal;
  onChange: (goal: DailyGoal) => void;
};

export function DailyGoalOptions({ value, onChange }: DailyGoalOptionsProps) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {dailyGoalOptions.map(({ goal, title }) => (
        <OptionRow
          key={goal}
          title={title}
          description={dailyGoalLabel(goal)}
          leading={{ text: String(goal) }}
          selected={goal === value}
          onPress={() => onChange(goal)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
