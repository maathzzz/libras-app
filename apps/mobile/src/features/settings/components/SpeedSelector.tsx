import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, depth, pressedOffset, radius, raised, sizes, spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui';

const speeds = ['0,5×', '0,75×', '1×'] as const;
type Speed = (typeof speeds)[number];

// Visual only: the MVP shows signs as images, so there is no video speed to apply yet.
export function SpeedSelector() {
  const [speed, setSpeed] = useState<Speed>('1×');

  return (
    <View style={styles.options} accessibilityRole="radiogroup">
      {speeds.map((option) => {
        const selected = option === speed;
        const edge = selected ? colors.accentSoftEdge : colors.border;
        const ring = selected ? undefined : colors.borderSubtle;

        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={`Velocidade ${option}`}
            accessibilityState={{ checked: selected }}
            onPress={() => setSpeed(option)}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: selected ? colors.accentSoft : colors.surface },
              pressed
                ? [raised(edge, depth.pressed, ring), pressedOffset(depth.sm)]
                : raised(edge, depth.sm, ring),
            ]}
          >
            <AppText variant="bodyStrong" color={selected ? 'accent' : 'textMuted'}>
              {option}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing['2xs'],
  },
  option: {
    flex: 1,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
});
