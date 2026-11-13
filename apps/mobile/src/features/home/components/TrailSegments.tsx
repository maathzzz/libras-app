import type { Trail } from '@libras/contracts';

import { colors } from '@/shared/theme';
import { SegmentBar } from '@/shared/ui';

import { trailLessonCounts, unitStatus, type UnitStatus } from './homeView';

type TrailSegmentsProps = {
  trail: Trail;
};

const segmentColors: Record<UnitStatus, string> = {
  completed: colors.success,
  current: colors.accentLight,
  locked: colors.track,
};

// Progress of a trail with one part per module, like the module map's bar of lessons.
export function TrailSegments({ trail }: TrailSegmentsProps) {
  const lessons = trailLessonCounts(trail);

  return (
    <SegmentBar
      segments={trail.units.map((unit) => ({
        key: unit.id,
        color: segmentColors[unitStatus(unit)],
      }))}
      progress={lessons.total === 0 ? 0 : lessons.completed / lessons.total}
      accessibilityLabel={`Progresso na trilha ${trail.title}`}
    />
  );
}
