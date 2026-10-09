import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, sizes } from '@/shared/theme';

import { Icon, type IconName } from './Icon';

type IconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  filled?: boolean;
};

// The design draws these at 30–34 pt; the pressable area is kept at the 44 pt minimum.
export function IconButton({ icon, accessibilityLabel, onPress, filled = false }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.button, filled && styles.filled, pressed && styles.pressed]}
    >
      <Icon name={icon} size="md" color="textSubtle" />
    </Pressable>
  );
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
});
