import { StyleSheet, View } from 'react-native';

import { colors, depth, radius, raised, spacing, type ColorToken } from '@/shared/theme';
import { AppText, Icon, type IconName } from '@/shared/ui';

export type ProfileStatTone = 'accent' | 'warning' | 'success';

type ProfileStatProps = {
  label: string;
  value: string;
  icon: IconName;
  tone: ProfileStatTone;
};

const tones: Record<
  ProfileStatTone,
  { background: string; edge: string; icon: ColorToken; text: ColorToken }
> = {
  accent: {
    background: colors.accentSoft,
    edge: colors.accentSoftEdge,
    icon: 'accent',
    text: 'accent',
  },
  warning: {
    background: colors.warningSoft,
    edge: colors.warningSoftEdge,
    icon: 'warning',
    text: 'warningDark',
  },
  success: {
    background: colors.successSoft,
    edge: colors.successSoftEdge,
    icon: 'successDark',
    text: 'successDark',
  },
};

// Unlike the centered StatTile, the label with its icon sits above the number.
export function ProfileStat({ label, value, icon, tone }: ProfileStatProps) {
  const look = tones[tone];

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.tile, { backgroundColor: look.background }, raised(look.edge, depth.sm)]}
    >
      <View style={styles.label}>
        <Icon name={icon} size="sm" color={look.icon} />
        <AppText variant="statLabel" color={look.text} numberOfLines={1}>
          {label}
        </AppText>
      </View>
      <AppText variant="heading" color={look.text} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
