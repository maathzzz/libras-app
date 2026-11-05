import type { AchievementStatus } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, ProgressBar } from '@/shared/ui';

import { AchievementIcon } from './AchievementIcon';
import { achievementAccessibilityLabel, formatUnlockDate, progressLabel } from './achievementView';

type AchievementRowProps = {
  achievement: AchievementStatus;
};

// Unlocked: colored badge and the date. Locked: gray badge and how far the learner is.
export function AchievementRow({ achievement }: AchievementRowProps) {
  const { title, description, category, progress, unlockedAt } = achievement;
  const locked = unlockedAt === null;

  return (
    <View
      accessible
      accessibilityLabel={achievementAccessibilityLabel(achievement)}
      style={styles.row}
    >
      <AchievementIcon category={category} locked={locked} />
      <View style={styles.text}>
        <AppText variant="bodyStrong" color={locked ? 'textMuted' : 'text'}>
          {title}
        </AppText>
        <AppText variant="caption">{description}</AppText>
        {locked ? (
          <View style={styles.progress}>
            <View style={styles.bar}>
              <ProgressBar value={progress.current / progress.target} size="sm" />
            </View>
            <AppText variant="caption">{progressLabel(progress)}</AppText>
          </View>
        ) : (
          <AppText variant="caption" color="successDark">
            {`Conquistada em ${formatUnlockDate(unlockedAt)}`}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  text: {
    flex: 1,
    gap: spacing['3xs'],
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing['2xs'],
  },
  bar: {
    flex: 1,
  },
});
