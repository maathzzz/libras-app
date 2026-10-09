import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, duration, radius, sizes } from '@/shared/theme';

type ProgressBarProps = {
  /** Between 0 and 1. */
  value: number;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
};

const heights = { sm: sizes.progressSm, md: sizes.progressMd } as const;
const radii = { sm: radius.xs, md: radius.sm } as const;

export function ProgressBar({ value, size = 'md', accessibilityLabel }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const progress = useSharedValue(clamped);

  useEffect(() => {
    progress.value = withTiming(clamped, { duration: duration.progress });
  }, [clamped, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const shape = { height: heights[size], borderRadius: radii[size] };

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, shape]}
    >
      <Animated.View style={[styles.fill, shape, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
  fill: {
    backgroundColor: colors.success,
  },
});
