import type { StreakStatus, StreakSummary } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { spacing, type ColorToken } from '@/shared/theme';
import { AppText, Card, Icon, Medal, ProgressBar, type CardTone } from '@/shared/ui';

import { daysLabel, streakCopy } from './homeView';

type StreakCardProps = {
  streak: StreakSummary;
};

type StreakLook = {
  tone: CardTone;
  lit: boolean;
  emphasis: ColorToken;
};

// Green when today's lesson is done (the design's daily goal), orange while the streak
// waits for today's lesson (the design's streak color) and neutral once it is lost, with the
// flame put out.
const looks: Record<StreakStatus, StreakLook> = {
  done_today: { tone: 'success', lit: true, emphasis: 'successDark' },
  at_risk: { tone: 'warning', lit: true, emphasis: 'warningDark' },
  broken: { tone: 'default', lit: false, emphasis: 'textMuted' },
};

export function StreakCard({ streak }: StreakCardProps) {
  const look = looks[streak.status];
  const copy = streakCopy(streak);

  return (
    <Card tone={look.tone}>
      <View style={styles.header}>
        <Medal icon="streak" tone={look.lit ? 'warning' : 'locked'} size="md" />
        <View style={styles.summary}>
          <View
            accessible
            accessibilityLabel={`Sequência de ${daysLabel(streak.current)}`}
            style={styles.value}
          >
            <AppText variant="headingStrong" color={look.emphasis}>
              {streak.current}
            </AppText>
            <AppText variant="caption">
              {streak.current === 1 ? 'dia seguido' : 'dias seguidos'}
            </AppText>
          </View>
          <AppText variant="bodyStrong" color={look.emphasis}>
            {copy.title}
          </AppText>
        </View>
        <View
          accessible
          accessibilityLabel={`Recorde: ${daysLabel(streak.longest)}`}
          style={styles.record}
        >
          <Icon name="trophy" size="sm" color="warning" />
          <AppText variant="statLabel" color="textMuted">
            Recorde
          </AppText>
          <AppText variant="label" color="textMuted">
            {daysLabel(streak.longest)}
          </AppText>
        </View>
      </View>
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
    gap: spacing.lg,
    paddingBottom: spacing['2xs'],
  },
  summary: {
    flex: 1,
  },
  value: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  record: {
    alignItems: 'center',
    gap: spacing['3xs'],
  },
});
