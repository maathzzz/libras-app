import { StyleSheet, View } from 'react-native';

import { colors, depth, radius, raised, spacing, type ColorToken } from '@/shared/theme';

import { AppText } from './AppText';

export type StatTileTone = 'success' | 'accent' | 'warning';

type StatTileProps = {
  value: string;
  label: string;
  tone: StatTileTone;
  /** Read as one sentence, e.g. "5 acertos de 6". Defaults to "label: value". */
  accessibilityLabel?: string;
};

const tones: Record<StatTileTone, { background: string; edge: string; value: ColorToken; label: ColorToken }> = {
  success: {
    background: colors.successSoft,
    edge: colors.successSoftEdge,
    value: 'successDark',
    label: 'successDark',
  },
  accent: {
    background: colors.accentSoft,
    edge: colors.accentSoftEdge,
    value: 'accent',
    label: 'accent',
  },
  warning: {
    background: colors.warningSoft,
    edge: colors.warningSoftEdge,
    value: 'warning',
    label: 'warningDark',
  },
};

// Big value over a short label in a tonal box (accuracy, time, streak days).
export function StatTile({ value, label, tone, accessibilityLabel }: StatTileProps) {
  const look = tones[tone];

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      style={[styles.tile, { backgroundColor: look.background }, raised(look.edge, depth.sm)]}
    >
      <AppText variant="heading" color={look.value} align="center" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="statLabel" color={look.label} align="center" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: spacing['3xs'],
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
});
