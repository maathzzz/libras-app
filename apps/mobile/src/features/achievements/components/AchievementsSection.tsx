import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import { AppText, Card } from '@/shared/ui';

import { useAchievementsStore } from '../store/achievementsStore';
import { AchievementRow } from './AchievementRow';
import { unlockedCount } from './achievementView';

// Profile section: every achievement in the BFF's order, unlocked or not, so the learner
// sees what is still ahead.
export function AchievementsSection() {
  const achievements = useAchievementsStore((state) => state.achievements);
  const failed = useAchievementsStore((state) => state.failed);
  const load = useAchievementsStore((state) => state.load);

  // Reloaded by the lesson feature after each completion; this covers the first visit.
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="kicker" accessibilityRole="header">
          Conquistas
        </AppText>
        {achievements && (
          <AppText variant="caption">
            {`${unlockedCount(achievements)} de ${achievements.length}`}
          </AppText>
        )}
      </View>
      {achievements ? (
        <Card>
          {achievements.map((achievement, index) => (
            <View key={achievement.id} style={index > 0 && styles.divided}>
              <AchievementRow achievement={achievement} />
            </View>
          ))}
        </Card>
      ) : (
        failed && (
          <AppText variant="caption">Não foi possível carregar suas conquistas agora.</AppText>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  divided: {
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
});
