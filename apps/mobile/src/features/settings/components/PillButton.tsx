import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing, type ColorToken } from '@/shared/theme';

import { AppText } from '@/shared/ui';

type PillButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: 'accent' | 'neutral';
};

const tones: Record<
  NonNullable<PillButtonProps['tone']>,
  { background: ColorToken; pressed: ColorToken; text: ColorToken }
> = {
  accent: { background: 'accentSoft', pressed: 'accentSoftEdge', text: 'accent' },
  neutral: { background: 'surfaceSubtle', pressed: 'border', text: 'textBody' },
};

// The design draws these pills smaller than 44pt; the Pressable around keeps the touch area.
export function PillButton({
  label,
  onPress,
  accessibilityLabel,
  tone = 'accent',
}: PillButtonProps) {
  const look = tones[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.touchArea}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.pill,
            { backgroundColor: colors[pressed ? look.pressed : look.background] },
          ]}
        >
          <AppText variant="bodyStrong" color={look.text}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    minWidth: sizes.minTouchTarget,
    minHeight: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
});
