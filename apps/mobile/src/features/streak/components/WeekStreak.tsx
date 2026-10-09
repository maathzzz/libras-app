import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui';

import { weekAccessibilityLabel, weekMarks, type WeekMarkState } from './weekMarks';

type WeekStreakProps = {
  /** Current streak, ending today. */
  days: number;
  today?: Date;
};

const markColors: Record<WeekMarkState, string> = {
  done: colors.successSoft,
  today: colors.success,
  none: colors.borderSubtle,
};

export function WeekStreak({ days, today = new Date() }: WeekStreakProps) {
  const marks = weekMarks(days, today);

  return (
    <View accessible accessibilityLabel={weekAccessibilityLabel(marks)} style={styles.row}>
      {marks.map((mark) => (
        <View key={mark.name} style={styles.day}>
          <View style={[styles.mark, { backgroundColor: markColors[mark.state] }]} />
          <AppText variant="statLabel" color="textSubtle" align="center">
            {mark.initial}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing['2xs'],
  },
  day: {
    flex: 1,
    gap: spacing['2xs'],
  },
  mark: {
    height: sizes.weekMark,
    borderRadius: radius.sm,
  },
});
