import type { Achievement } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Card } from '@/shared/ui';

import { AchievementIcon } from './AchievementIcon';
import { unlockedTitle } from './achievementView';

type UnlockedAchievementsCardProps = {
  achievements: readonly Achievement[];
};

// Shown on the lesson result when the BFF reports new achievements. Screen readers hear
// them in the result announcement, so the card itself is not announced again.
export function UnlockedAchievementsCard({ achievements }: UnlockedAchievementsCardProps) {
  if (achievements.length === 0) return null;

  return (
    <Card tone="accent">
      <AppText variant="bodyStrong" color="accentDark" accessibilityRole="header">
        {unlockedTitle(achievements)}
      </AppText>
      {achievements.map(({ id, title, description, category }) => (
        <View
          key={id}
          accessible
          accessibilityLabel={`${title}. ${description}`}
          style={styles.row}
        >
          <AchievementIcon category={category} />
          <View style={styles.text}>
            <AppText variant="bodyStrong">{title}</AppText>
            <AppText variant="caption">{description}</AppText>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing['2xs'],
  },
  text: {
    flex: 1,
    gap: spacing['3xs'],
  },
});
