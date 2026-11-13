import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, depth, radius, sizes, spacing, trailColors, duration } from '@/shared/theme';
import { AppText } from '@/shared/ui';

import { trailMap, type Point } from './trailMapLayout';

type TrailBalloonProps = {
  /** Center of the node the balloon points at. */
  center: Point;
  lessonTitle: string;
  onPress: () => void;
};

// Floats over the lesson to do now. Touching it is the same as touching the node, which
// is the control screen readers reach, so the balloon is hidden from them.
export function TrailBalloon({ center, lessonTitle, onPress }: TrailBalloonProps) {
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    lift.value = withRepeat(
      withTiming(-trailMap.balloonFloat, {
        duration: duration.balloonFloat,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [lift, reduceMotion]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.slot,
        {
          left: center.x - sizes.trailBalloonWidth / 2,
          top: center.y - sizes.trailNode / 2 - trailMap.balloonGap - sizes.trailBalloonHeight,
        },
        floatStyle,
      ]}
    >
      <Pressable accessible={false} onPress={onPress} style={styles.balloon}>
        <View style={styles.tail} />
        <AppText variant="callout" color="accentDark" align="center">
          Começar
        </AppText>
        <AppText variant="calloutDetail" align="center" numberOfLines={1}>
          {lessonTitle}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    width: sizes.trailBalloonWidth,
    height: sizes.trailBalloonHeight,
  },
  balloon: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    boxShadow: [
      { offsetX: 0, offsetY: depth.sm, blurRadius: 0, color: colors.accentSoftEdge },
      {
        offsetX: 0,
        offsetY: spacing.sm,
        blurRadius: spacing['3xl'],
        color: trailColors.balloonShadow,
      },
    ],
  },
  // A square turned into a diamond; its top half hides under the balloon.
  tail: {
    position: 'absolute',
    left: (sizes.trailBalloonWidth - sizes.trailBalloonTail) / 2,
    bottom: -(sizes.trailBalloonTail / 2 - 1),
    width: sizes.trailBalloonTail,
    height: sizes.trailBalloonTail,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
    boxShadow: [
      { offsetX: depth.sm, offsetY: depth.sm, blurRadius: 0, color: colors.accentSoftEdge },
    ],
  },
});
