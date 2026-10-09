import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing, type ColorToken } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type PillTone = 'accent' | 'success' | 'warning' | 'info' | 'neutral';

type PillProps = {
  label: string;
  tone?: PillTone;
  icon?: IconName;
  accessibilityLabel?: string;
};

const tones: Record<PillTone, { background: ColorToken; text: ColorToken; icon: ColorToken }> = {
  accent: { background: 'accentSoft', text: 'accent', icon: 'accent' },
  success: { background: 'successSoft', text: 'successDark', icon: 'successDark' },
  warning: { background: 'warningSoft', text: 'warningDark', icon: 'warning' },
  info: { background: 'infoSoft', text: 'infoDark', icon: 'infoDark' },
  neutral: { background: 'surfaceSubtle', text: 'textMuted', icon: 'textMuted' },
};

// Read-only badge for stats (streak, XP) and tags. Not a touch target.
export function Pill({ label, tone = 'accent', icon, accessibilityLabel }: PillProps) {
  const look = tones[tone];

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.pill, { backgroundColor: colors[look.background] }]}
    >
      {icon && <Icon name={icon} size="sm" color={look.icon} />}
      <AppText variant="pill" color={look.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing['2xs'],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
