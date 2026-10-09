import type { StreakStatus, StreakSummary } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { spacing, type ColorToken } from '@/shared/theme';
import { AppText, Card, Icon, ProgressBar, type CardTone } from '@/shared/ui';

import { daysLabel, streakCopy } from './homeView';

type StreakCardProps = {
  streak: StreakSummary;
};

type StreakLook = {
  tone: CardTone;
  flame: ColorToken;
  emphasis: ColorToken;
};

// Green when today's lesson is done (the design's daily goal), orange while the streak
// waits for today's lesson (the design's streak color) and neutral once it is lost.
const looks: Record<StreakStatus, StreakLook> = {
  done_today: { tone: 'success', flame: 'warning', emphasis: 'successDark' },
  at_risk: { tone: 'warning', flame: 'warning', emphasis: 'warningDark' },
  broken: { tone: 'default', flame: 'textSubtle', emphasis: 'textMuted' },
};

export function StreakCard({ streak }: StreakCardProps) {
  const look = looks[streak.status];
  const copy = streakCopy(streak);

  return (
    <Card tone={look.tone}>
      <View style={styles.header}>
        <View
          accessible
          accessibilityLabel={`Sequência de ${daysLabel(streak.current)}`}
          style={styles.value}
        >
          <Icon name="streak" size="lg" color={look.flame} />
          <AppText variant="heading" color={look.emphasis}>
            {streak.current}
          </AppText>
          <AppText variant="caption">
            {streak.current === 1 ? 'dia seguido' : 'dias seguidos'}
          </AppText>
        </View>
        <AppText variant="caption">{`Recorde: ${daysLabel(streak.longest)}`}</AppText>
      </View>
      <AppText variant="bodyStrong" color={look.emphasis}>
        {copy.title}
      </AppText>
      <ProgressBar
        value={streak.status === 'done_today' ? 1 : 0}
        accessibilityLabel="Lição de hoje"
      />
      <AppText variant="caption">{copy.hint}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
});
