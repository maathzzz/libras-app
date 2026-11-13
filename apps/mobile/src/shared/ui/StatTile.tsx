import { StyleSheet, View } from 'react-native';

import { colors, depth, radius, raised, spacing, type ColorToken } from '@/shared/theme';

import { AppText } from './AppText';
import type { IconName } from './Icon';
import { Medal } from './Medal';

export type StatTileTone = 'success' | 'accent' | 'warning';

type StatTileProps = {
  value: string;
  label: string;
  tone: StatTileTone;
  icon: IconName;
  /** Read as one sentence, e.g. "5 acertos de 6". Defaults to "label: value". */
  accessibilityLabel?: string;
};

const tones: Record<StatTileTone, { edge: string; value: ColorToken; label: ColorToken }> = {
  success: { edge: colors.successSoftEdge, value: 'successDark', label: 'successText' },
  accent: { edge: colors.accentSoftEdge, value: 'accent', label: 'accentDark' },
  warning: { edge: colors.warningSoftEdge, value: 'warning', label: 'warningDark' },
};

// A round medal over a big value and a short label (accuracy, time, streak days), on a
// white tile with the tone's chunky edge.
export function StatTile({ value, label, tone, icon, accessibilityLabel }: StatTileProps) {
  const look = tones[tone];

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      style={[styles.tile, raised(look.edge, depth.md, look.edge)]}
    >
      <Medal icon={icon} tone={tone} size="sm" />
      <View style={styles.text}>
        <AppText variant="headingStrong" color={look.value} align="center" numberOfLines={1}>
          {value}
        </AppText>
        <AppText variant="statLabel" color={look.label} align="center" numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  text: {
    alignSelf: 'stretch',
  },
});
