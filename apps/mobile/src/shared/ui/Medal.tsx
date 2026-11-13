import { StyleSheet, View, type BoxShadowValue, type ViewStyle } from 'react-native';

import { colors, depth, radius, sizes, trailColors, type ColorToken } from '@/shared/theme';

import { Icon, type IconName } from './Icon';

export type MedalTone = 'success' | 'accent' | 'warning' | 'info' | 'locked';
export type MedalSize = 'sm' | 'md' | 'lg' | 'xl';

type MedalProps = {
  icon: IconName;
  tone: MedalTone;
  size?: MedalSize;
  /** Sinks the medal, for when the control around it is pressed. */
  pressed?: boolean;
  /** Soft ring that marks the thing to do now, as on the current lesson of the module map. */
  halo?: boolean;
};

const tones: Record<MedalTone, { background: string; edge: string; icon: ColorToken }> = {
  success: { background: colors.success, edge: colors.successDark, icon: 'onColor' },
  accent: { background: colors.accent, edge: colors.accentDark, icon: 'onColor' },
  warning: { background: colors.warning, edge: colors.warningDark, icon: 'onColor' },
  info: { background: colors.info, edge: colors.infoDark, icon: 'onColor' },
  locked: {
    background: trailColors.lockedNode,
    edge: trailColors.lockedNodeEdge,
    icon: 'textMuted',
  },
};

const dimensions = {
  sm: { box: sizes.medalSm, edge: depth.sm, icon: 'md' },
  md: { box: sizes.medalMd, edge: depth.md, icon: 'lg' },
  lg: { box: sizes.trailNode, edge: depth.xl, icon: 'lg' },
  xl: { box: sizes.rewardBurst, edge: depth.xl, icon: 'xl' },
} as const;

const halo: BoxShadowValue = {
  offsetX: 0,
  offsetY: 0,
  blurRadius: 0,
  spreadDistance: sizes.trailNodeHalo,
  color: trailColors.currentHalo,
};

// The round, raised node of the module map ("trilha de aventura") used as a badge: a solid
// circle with a darker edge under it. Decorative: the control or text around it carries the
// accessible label.
export function Medal({
  icon,
  tone,
  size = 'md',
  pressed = false,
  halo: withHalo = false,
}: MedalProps) {
  const look = tones[tone];
  const { box, edge, icon: iconSize } = dimensions[size];
  // Pressing sinks the medal by half its edge, so its bottom stays put.
  const offsetY = pressed ? Math.ceil(edge / 2) : edge;
  const raisedEdge: BoxShadowValue = { offsetX: 0, offsetY, blurRadius: 0, color: look.edge };
  const shadow: ViewStyle = { boxShadow: withHalo ? [raisedEdge, halo] : [raisedEdge] };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.medal,
        { width: box, height: box, backgroundColor: look.background },
        shadow,
        pressed && { transform: [{ translateY: edge - offsetY }] },
      ]}
    >
      <Icon name={icon} size={iconSize} color={look.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  medal: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
});
