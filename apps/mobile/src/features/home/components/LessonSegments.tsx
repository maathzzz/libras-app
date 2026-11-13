import type { LessonStatus, TrailLesson } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';

type LessonSegmentsProps = {
  lessons: readonly TrailLesson[];
  /** Between 0 and 1, read out to screen readers. */
  progress: number;
};

const segmentColors: Record<LessonStatus, string> = {
  completed: colors.success,
  available: colors.accentLight,
  locked: colors.track,
};

// Progress bar of a module with one part per lesson, so the learner sees where the lesson
// to do now sits.
export function LessonSegments({ lessons, progress }: LessonSegmentsProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Progresso do módulo"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={styles.bar}
    >
      {lessons.map((lesson) => (
        <View
          key={lesson.id}
          style={[styles.segment, { backgroundColor: segmentColors[lesson.status] }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: spacing['2xs'],
  },
  segment: {
    flex: 1,
    height: sizes.progressSm,
    borderRadius: radius.xs,
  },
});
