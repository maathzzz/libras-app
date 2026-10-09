import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import {
  colors,
  depth,
  fontFamily,
  fontSize,
  radius,
  raised,
  sizes,
  spacing,
  type ColorToken,
} from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | undefined;
  /** Shown at the left of the field, hinting what goes in it. */
  icon?: IconName;
  placeholder?: string;
} & Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'keyboardType'
  | 'onSubmitEditing'
  | 'returnKeyType'
  | 'secureTextEntry'
  | 'textContentType'
>;

type FieldState = 'rest' | 'focused' | 'error';

// Same raised look as the cards and secondary buttons; the ring takes the state color.
const looks: Record<FieldState, { edge: string; ring: string; icon: ColorToken }> = {
  rest: { edge: colors.border, ring: colors.border, icon: 'textSubtle' },
  focused: { edge: colors.accentSoftEdge, ring: colors.accent, icon: 'accent' },
  error: { edge: colors.dangerSoftEdge, ring: colors.danger, icon: 'danger' },
};

// The label stays visible above the field: a placeholder alone disappears while typing.
export function TextField({
  label,
  value,
  onChangeText,
  error,
  icon,
  secureTextEntry = false,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const state: FieldState = error !== undefined ? 'error' : focused ? 'focused' : 'rest';
  const look = looks[state];

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong" color={error !== undefined ? 'danger' : 'text'}>
        {label}
      </AppText>
      <View style={[styles.field, raised(look.edge, depth.sm, look.ring)]}>
        {icon && <Icon name={icon} size="md" color={look.icon} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry && !revealed}
          accessibilityLabel={label}
          accessibilityHint={error}
          autoCorrect={false}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.accent}
          style={[styles.input, secureTextEntry && styles.inputBeforeToggle]}
          {...inputProps}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setRevealed((current) => !current)}
            style={styles.toggle}
          >
            <Icon name={revealed ? 'hide' : 'show'} size="lg" color="textSubtle" />
          </Pressable>
        )}
      </View>
      {error !== undefined && (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: sizes.buttonLg,
    paddingLeft: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingRight: spacing.xl,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  inputBeforeToggle: {
    paddingRight: 0,
  },
  // Full field height and 44pt wide, so the eye is easy to hit.
  toggle: {
    width: sizes.minTouchTarget,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['2xs'],
  },
});
