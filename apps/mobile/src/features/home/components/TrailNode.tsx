import type { LessonStatus, TrailLesson } from '@libras/contracts';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type BoxShadowValue, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  colors,
  depth,
  duration,
  pressedOffset,
  radius,
  raised,
  sizes,
  spacing,
  trailColors,
  type ColorToken,
} from '@/shared/theme';
import { AppText, Icon, type IconName } from '@/shared/ui';

import { lessonAccessibilityLabel } from './homeView';
import { trailMap, type Point } from './trailMapLayout';

type NodeLook = {
  background: string;
  edge: string;
  icon: IconName;
  iconColor: ColorToken;
  kickerColor: ColorToken;
  titleColor: ColorToken;
};

const looks: Record<LessonStatus, NodeLook> = {
  completed: {
    background: colors.success,
    edge: colors.successDark,
    icon: 'check',
    iconColor: 'onColor',
    kickerColor: 'successText',
    titleColor: 'text',
  },
  available: {
    background: colors.accent,
    edge: colors.accentDark,
    icon: 'play',
    iconColor: 'onColor',
    kickerColor: 'accentDark',
    titleColor: 'text',
  },
  locked: {
    background: trailColors.lockedNode,
    edge: trailColors.lockedNodeEdge,
    icon: 'locked',
    iconColor: 'textMuted',
    kickerColor: 'textMuted',
    titleColor: 'lockedText',
  },
};

const halo: BoxShadowValue = {
  offsetX: 0,
  offsetY: 0,
  blurRadius: 0,
  spreadDistance: sizes.trailNodeHalo,
  color: trailColors.currentHalo,
};

// The raised edge of the design, plus a halo around the lesson to do now. Pressing sinks
// the node by half its edge.
function nodeShadow(edge: string, pressed: boolean, current: boolean): ViewStyle[] {
  const offsetY = pressed ? depth.sm : depth.xl;
  const raisedEdge: BoxShadowValue = { offsetX: 0, offsetY, blurRadius: 0, color: edge };
  const style: ViewStyle = { boxShadow: current ? [raisedEdge, halo] : [raisedEdge] };
  return pressed ? [style, pressedOffset(depth.xl, depth.sm)] : [style];
}

type TrailNodeProps = {
  lesson: TrailLesson;
  /** Position of the lesson in its module, starting at 1. */
  number: number;
  center: Point;
  onPress: () => void;
};

const nodeRadius = sizes.trailNode / 2;

// Completed lessons can be done again; locked ones are announced as disabled.
export function TrailNode({ lesson, number, center, onPress }: TrailNodeProps) {
  const look = looks[lesson.status];
  const current = lesson.status === 'available';
  const locked = lesson.status === 'locked';

  return (
    <View style={[styles.node, { left: center.x - nodeRadius, top: center.y - nodeRadius }]}>
      {current && <PulseRing />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lessonAccessibilityLabel(lesson, number)}
        accessibilityHint={locked ? undefined : 'Abre a lição'}
        accessibilityState={{ disabled: locked }}
        disabled={locked}
        onPress={onPress}
        style={({ pressed }) => [
          styles.circle,
          { backgroundColor: look.background },
          nodeShadow(look.edge, pressed, current),
        ]}
      >
        <Icon name={look.icon} size="lg" color={look.iconColor} />
      </Pressable>
    </View>
  );
}

// A ring that grows out of the node and fades, over and over. Off when the system asks
// for reduced motion.
function PulseRing() {
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

type TrailNodeLabelProps = {
  lesson: TrailLesson;
  number: number;
  center: Point;
};

// "LIÇÃO N" and the lesson name, under the node. Screen readers already hear both on the
// node itself.
export function TrailNodeLabel({ lesson, number, center }: TrailNodeLabelProps) {
  const look = looks[lesson.status];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.labelSlot,
        {
          left: center.x - sizes.trailLabelMaxWidth / 2,
          top: center.y + nodeRadius + trailMap.labelGap,
        },
      ]}
    >
      <View style={styles.label}>
        <AppText variant="statLabel" color={look.kickerColor} align="center">
          {`Lição ${number}`}
        </AppText>
        <AppText variant="nodeTitle" color={look.titleColor} align="center" numberOfLines={2}>
          {lesson.title}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    position: 'absolute',
    width: sizes.trailNode,
    height: sizes.trailNode,
  },
  circle: {
    width: sizes.trailNode,
    height: sizes.trailNode,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
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
  labelSlot: {
    position: 'absolute',
    width: sizes.trailLabelMaxWidth,
    alignItems: 'center',
  },
  label: {
    paddingTop: spacing['2xs'],
    paddingBottom: spacing['2xs'],
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...raised(trailColors.labelEdge, depth.xs),
  },
});
