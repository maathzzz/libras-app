import type { Trail } from '@libras/contracts';

import { colors } from '@/shared/theme';
import { SegmentBar } from '@/shared/ui';

import { trailLessonCounts, unitProgress, unitStatus, type UnitStatus } from './homeView';

type TrailSegmentsProps = {
  trail: Trail;
};

const segmentColors: Record<UnitStatus, string> = {
  completed: colors.success,
  current: colors.accentLight,
  locked: colors.track,
};

// Progress of a trail with one part per module, like the module map's bar of lessons. The
// module in progress fills in green as its lessons are done, so a trail with a single
// module does not look empty.
export function TrailSegments({ trail }: TrailSegmentsProps) {
  const lessons = trailLessonCounts(trail);

  return (
    <SegmentBar
      segments={trail.units.map((unit) => {
        const status = unitStatus(unit);
        return {
          key: unit.id,
          color: segmentColors[status],
          ...(status === 'current' && {
            fill: { color: colors.success, amount: unitProgress(unit) },
          }),
        };
      })}
      progress={lessons.total === 0 ? 0 : lessons.completed / lessons.total}
      accessibilityLabel={`Progresso na trilha ${trail.title}`}
    />
  );
}
