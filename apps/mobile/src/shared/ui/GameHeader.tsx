import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing, trailColors } from '@/shared/theme';

type GameHeaderProps = {
  children: ReactNode;
};

// White bar fixed at the top of the game-like screens (module map, home, profile). It is
// drawn over the content below, so its shadow falls on the scenery.
export function GameHeader({ children }: GameHeaderProps) {
  return <View style={styles.header}>{children}</View>;
}

// The same bar at the bottom, holding the screen's main action.
export function GameFooter({ children }: GameHeaderProps) {
  return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
  header: {
    zIndex: 1,
    paddingTop: spacing['3xs'],
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    boxShadow: [
      { offsetX: 0, offsetY: 1, blurRadius: 0, color: colors.border },
      { offsetX: 0, offsetY: spacing.xs, blurRadius: spacing.xl, color: trailColors.headerShadow },
    ],
  },
  footer: {
    zIndex: 1,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    boxShadow: [
      { offsetX: 0, offsetY: -1, blurRadius: 0, color: colors.border },
      { offsetX: 0, offsetY: -spacing.xs, blurRadius: spacing.xl, color: trailColors.headerShadow },
    ],
  },
});
