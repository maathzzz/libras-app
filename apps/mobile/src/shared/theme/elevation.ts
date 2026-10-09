import type { BoxShadowValue, ViewStyle } from 'react-native';

import { borderWidth, depth } from './tokens';

type Depth = (typeof depth)[keyof typeof depth];

/**
 * The design's raised look: a solid shadow offset straight down plus an optional
 * hairline ring. `boxShadow` is used instead of `elevation`/`shadow*` because only it
 * renders an unblurred, colored offset identically on Android and iOS.
 */
export function raised(edgeColor: string, size: Depth, ringColor?: string): ViewStyle {
  const edge: BoxShadowValue = { offsetX: 0, offsetY: size, blurRadius: 0, color: edgeColor };
  if (!ringColor) return { boxShadow: [edge] };

  const ring: BoxShadowValue = {
    offsetX: 0,
    offsetY: 0,
    blurRadius: 0,
    spreadDistance: borderWidth.hairline,
    color: ringColor,
  };
  return { boxShadow: [edge, ring] };
}

// Pressed elements move down by the depth they lose, so the bottom edge stays put.
export function pressedOffset(size: Depth): ViewStyle {
  return { transform: [{ translateY: size - depth.pressed }] };
}
