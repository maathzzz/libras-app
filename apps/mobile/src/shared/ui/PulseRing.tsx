import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { duration, radius, sizes, trailColors } from '@/shared/theme';

// A ring that grows out of a round node and fades, over and over, to mark the thing to do
// now. Place it inside a box the size of the node. Off when the system asks for reduced
// motion.
export function PulseRing() {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(
      withTiming(1, { duration: duration.trailRing, easing: Easing.out(Easing.ease) }),
      -1,
    );
  }, [progress, reduceMotion]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 0.9 + 0.4 * progress.value }],
  }));

  if (reduceMotion) return null;
  return <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />;
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: -sizes.trailNodeRingGap,
    right: -sizes.trailNodeRingGap,
    bottom: -sizes.trailNodeRingGap,
    left: -sizes.trailNodeRingGap,
    borderRadius: radius.pill,
    borderWidth: sizes.trailNodeRing,
    borderColor: trailColors.currentRing,
  },
});
