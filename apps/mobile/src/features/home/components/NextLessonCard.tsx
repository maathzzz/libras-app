import { StyleSheet, View } from 'react-native';

import { colors, depth, gradients, radius, spacing, trailColors } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

import { nextLessonCopy, type NextLesson } from './homeView';

type NextLessonCardProps = {
  next: NextLesson;
  isFirstLesson: boolean;
  onStart: () => void;
};

// Size of the decorative circle in the card's top corner. It is cut by the card's edge.
const circleSize = 160;

// The design's highlight card: the lesson to do now over the accent → teal gradient, with
// the button that opens it. The edge under it is the same gradient, darker.
export function NextLessonCard({ next, isFirstLesson, onStart }: NextLessonCardProps) {
  const copy = nextLessonCopy(next, isFirstLesson);

  return (
    <View style={styles.edge}>
      <View style={styles.card}>
        <View pointerEvents="none" style={styles.circle} />
        <View style={styles.text}>
          <AppText variant="kicker" color="onColorMuted">
            {copy.kicker}
          </AppText>
          <AppText variant="heading" color="onColor" accessibilityRole="header">
            {copy.title}
          </AppText>
          <AppText variant="caption" color="onColorMuted">
            {copy.description}
          </AppText>
        </View>
        <Button label={copy.action} variant="inverse" onPress={onStart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // A view under the card instead of a box shadow, which cannot be a gradient.
  edge: {
    paddingBottom: depth.lg,
    borderRadius: radius['3xl'],
    experimental_backgroundImage: gradients.highlightEdge,
    boxShadow: [
      {
        offsetX: 0,
        offsetY: spacing.sm,
        blurRadius: spacing['3xl'],
        color: trailColors.balloonShadow,
      },
    ],
  },
  card: {
    gap: spacing['3xl'],
    padding: spacing['2xl'],
    paddingTop: spacing['3xl'],
    borderRadius: radius['3xl'],
    overflow: 'hidden',
    experimental_backgroundImage: gradients.highlight,
  },
  circle: {
    position: 'absolute',
    top: -circleSize / 3,
    right: -circleSize / 4,
    width: circleSize,
    height: circleSize,
    borderRadius: radius.pill,
    backgroundColor: colors.onColorFaint,
  },
  text: {
    gap: spacing.xs,
  },
});
