import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, depth, pressedOffset, radius, raised, sizes, spacing } from '@/shared/theme';

// `accent` marks a selected option; `success`/`danger` mark a checked answer.
export type CardTone = 'default' | 'accent' | 'success' | 'danger' | 'warning';

type CardProps = {
  children: ReactNode;
  tone?: CardTone;
  onPress?: () => void;
  accessibilityLabel?: string;
  selected?: boolean;
};

const tones: Record<CardTone, { background: string; edge: string; ring?: string }> = {
  default: { background: colors.surface, edge: colors.border, ring: colors.borderSubtle },
  accent: { background: colors.accentSoft, edge: colors.accentSoftEdge },
  success: { background: colors.successSoft, edge: colors.successSoftEdge },
  danger: { background: colors.dangerSoft, edge: colors.dangerSoftEdge },
  warning: { background: colors.warningSoft, edge: colors.warningSoftEdge },
};

export function Card({
  children,
  tone = 'default',
  onPress,
  accessibilityLabel,
  selected,
}: CardProps) {
  const { background, edge, ring } = tones[tone];

  if (!onPress) {
    return (
      <View style={[styles.base, { backgroundColor: background }, raised(edge, depth.sm, ring)]}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles.pressable,
        { backgroundColor: background },
        pressed
          ? [raised(edge, depth.pressed, ring), pressedOffset(depth.md)]
          : raised(edge, depth.md, ring),
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius['2xl'],
  },
  pressable: {
    minHeight: sizes.minTouchTarget,
  },
});
