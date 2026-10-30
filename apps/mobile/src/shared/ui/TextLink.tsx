import { Pressable, StyleSheet } from 'react-native';

import { sizes } from '@/shared/theme';

import { AppText } from './AppText';

type TextLinkProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
};

// Small underlined text for actions that should not draw attention. The touch area still
// keeps the 44 pt minimum.
export function TextLink({ label, onPress, disabled = false, accessibilityHint }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={styles.link}
    >
      {({ pressed }) => (
        <AppText variant="textLink" color={pressed ? 'text' : 'textMuted'} align="center">
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'center',
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
  },
});
