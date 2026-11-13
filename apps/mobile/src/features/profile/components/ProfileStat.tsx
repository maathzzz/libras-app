import { StyleSheet, View } from 'react-native';

import { colors, depth, radius, raised, spacing, type ColorToken } from '@/shared/theme';
import { AppText, Medal, type IconName } from '@/shared/ui';

export type ProfileStatTone = 'accent' | 'warning' | 'success';

type ProfileStatProps = {
  label: string;
  value: string;
  icon: IconName;
  tone: ProfileStatTone;
};

const tones: Record<ProfileStatTone, { edge: string; text: ColorToken }> = {
  accent: { edge: colors.accentSoftEdge, text: 'accentDark' },
  warning: { edge: colors.warningSoftEdge, text: 'warningDark' },
  success: { edge: colors.successSoftEdge, text: 'successText' },
};

// A round medal beside the number and its label, on a white tile with the tone's chunky
// edge. Unlike the centered StatTile, it fits two per row with long labels.
export function ProfileStat({ label, value, icon, tone }: ProfileStatProps) {
  const look = tones[tone];

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.tile, raised(look.edge, depth.md, look.edge)]}
    >
      <Medal icon={icon} tone={tone} size="sm" />
      <View style={styles.text}>
        <AppText variant="subtitle" numberOfLines={1}>
          {value}
        </AppText>
        <AppText variant="statLabel" color={look.text} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  text: {
    flex: 1,
    gap: spacing['3xs'],
  },
});
