import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, depth, duration, radius, raised, sizes } from '@/shared/theme';

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

const inset = (sizes.switchHeight - sizes.switchThumb) / 2;
const travel = sizes.switchWidth - sizes.switchThumb - inset * 2;

// The design's track is 46×27; the Pressable around it keeps the 44pt touch area.
export function Switch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: SwitchProps) {
  const position = useSharedValue(value ? travel : 0);

  useEffect(() => {
    position.value = withTiming(value ? travel : 0, { duration: duration.toggle });
  }, [value, position]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={styles.touchArea}
    >
      <View
        style={[styles.track, { backgroundColor: value ? colors.success : colors.disabledEdge }]}
      >
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    minWidth: sizes.minTouchTarget,
    minHeight: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: sizes.switchWidth,
    height: sizes.switchHeight,
    padding: inset,
    borderRadius: radius.pill,
  },
  thumb: {
    width: sizes.switchThumb,
    height: sizes.switchThumb,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...raised(colors.border, depth.pressed),
  },
});
