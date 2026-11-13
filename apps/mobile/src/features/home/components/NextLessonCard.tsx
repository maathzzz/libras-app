import { StyleSheet, View } from 'react-native';

import { colors, depth, radius, sizes, spacing, trailColors } from '@/shared/theme';
import { AppText, Button, Medal, PulseRing } from '@/shared/ui';

import { nextLessonCopy, type NextLesson } from './homeView';

type NextLessonCardProps = {
  next: NextLesson;
  isFirstLesson: boolean;
  onStart: () => void;
};

// The module map's "Começar" balloon as a card: the pulsing node of the lesson to do now,
// its name and the button that opens it. The node is decorative; the button is the control.
export function NextLessonCard({ next, isFirstLesson, onStart }: NextLessonCardProps) {
  const copy = nextLessonCopy(next, isFirstLesson);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.node}>
          <PulseRing />
          <Medal icon="play" tone="accent" size="lg" halo />
        </View>
        <View style={styles.text}>
          <AppText variant="callout" color="accentDark">
            {copy.kicker}
          </AppText>
          <AppText variant="subtitle" accessibilityRole="header">
            {copy.title}
          </AppText>
          <AppText variant="caption">{copy.description}</AppText>
        </View>
      </View>
      <Button label={copy.action} onPress={onStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xl,
    padding: spacing['2xl'],
    borderRadius: radius['3xl'],
    backgroundColor: colors.surface,
    boxShadow: [
      { offsetX: 0, offsetY: depth.lg, blurRadius: 0, color: colors.accentSoftEdge },
      {
        offsetX: 0,
        offsetY: spacing.sm,
        blurRadius: spacing['3xl'],
        color: trailColors.balloonShadow,
      },
    ],
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2xl'],
  },
  // Room for the halo around the node.
  node: {
    width: sizes.trailNode,
    height: sizes.trailNode,
    margin: sizes.trailNodeHalo / 2,
  },
  text: {
    flex: 1,
    gap: spacing['3xs'],
  },
});
