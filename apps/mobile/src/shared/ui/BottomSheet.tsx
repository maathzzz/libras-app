import { useEffect, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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
//
// The slide is a shared value, not an `entering` layout animation: on Android the layout
// animation sometimes never ran and left the sheet off screen, hiding the lesson's
// "Continuar" button with no way forward.
export function BottomSheet({ children, tone = 'default' }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.value = withTiming(1, { duration: duration.sheet });
  }, [shown]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - shown.value) * height }],
  }));

  return (
    <Animated.View
      accessibilityViewIsModal
      style={[
        styles.sheet,
        { backgroundColor: backgrounds[tone], paddingBottom: spacing['3xl'] + insets.bottom },
        slideStyle,
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
