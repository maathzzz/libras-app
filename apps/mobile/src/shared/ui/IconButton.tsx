import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, depth, pressedOffset, radius, raised, sizes } from '@/shared/theme';

import { Icon, type IconName } from './Icon';

type IconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  /** `filled` sits on a gray square; `raised` is a white key with the chunky edge. */
  look?: 'plain' | 'filled' | 'raised';
  size?: ComponentProps<typeof Icon>['size'];
};

// The design draws these at 30–42 pt; the pressable area is kept at the 44 pt minimum.
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  look = 'plain',
  size = 'md',
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.button, lookStyles(look, pressed)]}
    >
      <Icon name={icon} size={size} color={look === 'raised' ? 'text' : 'textSubtle'} />
    </Pressable>
  );
}

function lookStyles(look: NonNullable<IconButtonProps['look']>, pressed: boolean) {
  if (look === 'raised') {
    return pressed
      ? [
          styles.raised,
          raised(colors.border, depth.pressed, colors.borderSubtle),
          pressedOffset(depth.sm),
        ]
      : [styles.raised, raised(colors.border, depth.sm, colors.borderSubtle)];
  }
  if (pressed) return styles.pressed;
  return look === 'filled' ? styles.filled : null;
}

const styles = StyleSheet.create({
  button: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  filled: {
    backgroundColor: colors.surfaceSubtle,
  },
  pressed: {
    backgroundColor: colors.border,
  },
  raised: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});
