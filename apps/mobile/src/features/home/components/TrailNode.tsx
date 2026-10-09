import type { TrailUnit, UnitStatus } from '@libras/contracts';
import { Pressable, StyleSheet, View, type BoxShadowValue, type ViewStyle } from 'react-native';

import {
  colors,
  depth,
  pressedOffset,
  radius,
  sizes,
  spacing,
  type ColorToken,
} from '@/shared/theme';
import { AppText, Icon, type IconName } from '@/shared/ui';

import { unitAccessibilityLabel } from './homeCopy';

type TrailNodeProps = {
  unit: TrailUnit;
  onPress?: (() => void) | undefined;
};

type NodeLook = {
  background: string;
  edge: string;
  icon: IconName;
  iconColor: ColorToken;
  labelColor: ColorToken;
};

const looks: Record<UnitStatus, NodeLook> = {
  done: {
    background: colors.success,
    edge: colors.successDark,
    icon: 'check',
    iconColor: 'onColor',
    labelColor: 'text',
  },
  current: {
    background: colors.accent,
    edge: colors.accentDark,
    icon: 'play',
    iconColor: 'onColor',
    labelColor: 'text',
  },
  locked: {
    background: colors.lockedSurface,
    edge: colors.locked,
    icon: 'locked',
    iconColor: 'textSubtle',
    labelColor: 'textMuted',
  },
};

const halo: BoxShadowValue = {
  offsetX: 0,
  offsetY: 0,
  blurRadius: 0,
  spreadDistance: sizes.trailNodeHalo,
  color: colors.accentSoft,
};

// Same raised edge as `raised()`, plus a halo that marks where the learner is.
function nodeShadow(edge: string, offsetY: number, highlighted: boolean): ViewStyle {
  const shadows: BoxShadowValue[] = [{ offsetX: 0, offsetY, blurRadius: 0, color: edge }];
  return { boxShadow: highlighted ? [...shadows, halo] : shadows };
}

export function TrailNode({ unit, onPress }: TrailNodeProps) {
  const look = looks[unit.status];
  const highlighted = unit.status === 'current';
  const icon = <Icon name={look.icon} size="lg" color={look.iconColor} />;
  const circle = [styles.circle, { backgroundColor: look.background }];

  return (
    <View style={styles.node}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unitAccessibilityLabel(unit)}
          accessibilityHint="Abre a próxima lição"
          onPress={onPress}
          style={({ pressed }) => [
            circle,
            pressed
              ? [nodeShadow(look.edge, depth.pressed, highlighted), pressedOffset(depth.md)]
              : nodeShadow(look.edge, depth.md, highlighted),
          ]}
        >
          {icon}
        </Pressable>
      ) : (
        <View
          accessible
          accessibilityLabel={unitAccessibilityLabel(unit)}
          style={[circle, nodeShadow(look.edge, depth.md, highlighted)]}
        >
          {icon}
        </View>
      )}
      <AppText variant="label" color={look.labelColor} align="center" numberOfLines={2}>
        {unit.title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    width: sizes.trailNode * 2,
    alignItems: 'center',
    gap: spacing.xs,
  },
  circle: {
    width: sizes.trailNode,
    height: sizes.trailNode,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
});
