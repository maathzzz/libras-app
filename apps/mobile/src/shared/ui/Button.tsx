import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import {
  colors,
  depth,
  pressedOffset,
  radius,
  raised,
  sizes,
  spacing,
  type ColorToken,
  type TextVariant,
} from '@/shared/theme';

import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  accessibilityHint?: string;
};

type Appearance = {
  container: ViewStyle;
  rest: ViewStyle;
  pressed: ViewStyle;
  text: TextVariant;
  textColor: ColorToken;
};

const appearances: Record<ButtonVariant | 'disabled', Appearance> = {
  primary: {
    container: { height: sizes.buttonLg, backgroundColor: colors.success },
    rest: raised(colors.successDark, depth.lg),
    pressed: { ...raised(colors.successDark, depth.pressed), ...pressedOffset(depth.lg) },
    text: 'button',
    textColor: 'onColor',
  },
  secondary: {
    container: { height: sizes.buttonMd, backgroundColor: colors.surface },
    rest: raised(colors.border, depth.md, colors.border),
    pressed: {
      ...raised(colors.border, depth.pressed, colors.border),
      ...pressedOffset(depth.md),
    },
    text: 'buttonSmall',
    textColor: 'accent',
  },
  danger: {
    container: { height: sizes.buttonMd, backgroundColor: colors.surface },
    rest: raised(colors.dangerSoftEdge, depth.md, colors.dangerSoftEdge),
    pressed: {
      ...raised(colors.dangerSoftEdge, depth.pressed, colors.dangerSoftEdge),
      ...pressedOffset(depth.md),
    },
    text: 'buttonSmall',
    textColor: 'danger',
  },
  ghost: {
    container: { height: sizes.minTouchTarget },
    rest: {},
    pressed: { backgroundColor: colors.surfaceSubtle },
    text: 'link',
    textColor: 'textSubtle',
  },
  disabled: {
    container: { height: sizes.buttonLg, backgroundColor: colors.disabled },
    rest: raised(colors.disabledEdge, depth.lg),
    pressed: raised(colors.disabledEdge, depth.lg),
    text: 'button',
    textColor: 'disabledText',
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityHint,
}: ButtonProps) {
  const look = appearances[disabled ? 'disabled' : variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, look.container, pressed ? look.pressed : look.rest]}
    >
      <AppText variant={look.text} color={look.textColor} align="center" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    minHeight: sizes.minTouchTarget,
    minWidth: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    borderRadius: radius.xl,
  },
});
