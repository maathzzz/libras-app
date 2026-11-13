import type { LessonStatus, TrailLesson } from '@libras/contracts';

import { colors } from '@/shared/theme';
import { SegmentBar } from '@/shared/ui';

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

// Progress of a module with one part per lesson, so the learner sees where the lesson to do
// now sits.
export function LessonSegments({ lessons, progress }: LessonSegmentsProps) {
  return (
    <SegmentBar
      segments={lessons.map((lesson) => ({ key: lesson.id, color: segmentColors[lesson.status] }))}
      progress={progress}
      accessibilityLabel="Progresso do módulo"
    />
  );
}
