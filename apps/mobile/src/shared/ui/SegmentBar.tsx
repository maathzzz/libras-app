import { StyleSheet, View } from 'react-native';

import { radius, sizes, spacing } from '@/shared/theme';

type Segment = {
  key: string;
  color: string;
  /** Part of the segment filled from the start, for an item done in part (a module in progress). */
  fill?: { color: string; amount: number };
};

type SegmentBarProps = {
  /** One part per item, in order, already colored by its state. */
  segments: readonly Segment[];
  /** Between 0 and 1, read out to screen readers. */
  progress: number;
  accessibilityLabel: string;
};

// Progress bar split in one part per lesson or module, as in the module map's header, so the
// learner sees where the next one sits.
export function SegmentBar({ segments, progress, accessibilityLabel }: SegmentBarProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={styles.bar}
    >
      {segments.map(({ key, color, fill }) => (
        <View key={key} style={[styles.segment, { backgroundColor: color }]}>
          {fill && fill.amount > 0 && (
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.min(1, fill.amount) * 100}%`,
                  backgroundColor: fill.color,
                },
              ]}
            />
          )}
        </View>
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
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
