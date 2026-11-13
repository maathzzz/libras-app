import { StyleSheet, View } from 'react-native';

import { radius, sizes, spacing } from '@/shared/theme';

type SegmentBarProps = {
  /** One part per item, in order, already colored by its state. */
  segments: readonly { key: string; color: string }[];
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
      {segments.map(({ key, color }) => (
        <View key={key} style={[styles.segment, { backgroundColor: color }]} />
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
