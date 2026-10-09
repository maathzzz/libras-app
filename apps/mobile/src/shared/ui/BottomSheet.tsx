import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, duration, radius, spacing } from '@/shared/theme';

export type BottomSheetTone = 'default' | 'success' | 'danger';

type BottomSheetProps = {
  children: ReactNode;
  tone?: BottomSheetTone;
};

const backgrounds: Record<BottomSheetTone, string> = {
  default: colors.surface,
  success: colors.successSoft,
  danger: colors.dangerSoft,
};

// Panel pinned to the bottom of the parent, over its content. The parent decides when it
// is shown; it slides in so the change is noticed without sound.
export function BottomSheet({ children, tone = 'default' }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={SlideInDown.duration(duration.sheet)}
      accessibilityViewIsModal
      style={[
        styles.sheet,
        { backgroundColor: backgrounds[tone], paddingBottom: spacing['3xl'] + insets.bottom },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: spacing.md,
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing['3xl'],
    borderTopLeftRadius: radius['4xl'],
    borderTopRightRadius: radius['4xl'],
  },
});
