import type { NextLesson } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { colors, depth, radius, raised, spacing } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

import { nextLessonCopy } from './homeCopy';

type NextLessonCardProps = {
  lesson: NextLesson;
  isFirstLesson: boolean;
  onStart: () => void;
};

// The design paints this card with an accent → teal gradient; it stays solid until
// gradients are decided (docs/design/tokens.md).
export function NextLessonCard({ lesson, isFirstLesson, onStart }: NextLessonCardProps) {
  const copy = nextLessonCopy(lesson, isFirstLesson);

  return (
    <View style={styles.card}>
      <AppText variant="kicker" color="onColor">
        {copy.kicker}
      </AppText>
      <AppText variant="heading" color="onColor" accessibilityRole="header">
        {copy.title}
      </AppText>
      <AppText variant="caption" color="onColor">
        {copy.description}
      </AppText>
      <View style={styles.action}>
        <Button label={copy.action} variant="secondary" onPress={onStart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing['2xs'],
    padding: spacing['2xl'],
    borderRadius: radius['3xl'],
    backgroundColor: colors.accent,
    ...raised(colors.accentDark, depth.lg),
  },
  action: {
    marginTop: spacing.md,
  },
});
