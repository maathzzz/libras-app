import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { colors, duration, radius, sizes, type ColorToken } from '@/shared/theme';
import { Medal } from '@/shared/ui';

type Piece = {
  /** Center of the piece as a fraction of the confetti area, read off the design's SVG. */
  x: number;
  y: number;
  color: ColorToken;
  /** Strokes have an angle; pieces without one are dots. */
  angle?: number;
};

const pieces: readonly Piece[] = [
  { x: 0.175, y: 0.29, color: 'warning', angle: 56 },
  { x: 0.84, y: 0.32, color: 'info', angle: -51 },
  { x: 0.13, y: 0.53, color: 'danger', angle: 0 },
  { x: 0.92, y: 0.56, color: 'success', angle: 0 },
  { x: 0.19, y: 0.63, color: 'info', angle: -42 },
  { x: 0.82, y: 0.65, color: 'warning', angle: 42 },
  { x: 0.31, y: 0.24, color: 'danger' },
  { x: 0.69, y: 0.22, color: 'success' },
  { x: 0.075, y: 0.64, color: 'warning' },
  { x: 0.93, y: 0.65, color: 'accent' },
];

function pieceStyle({ x, y, color, angle }: Piece) {
  const isStroke = angle !== undefined;
  const width = isStroke ? sizes.confettiStrokeLength : sizes.confettiDot;
  const height = isStroke ? sizes.confettiStrokeWidth : sizes.confettiDot;
  return {
    width,
    height,
    left: x * sizes.confettiAreaWidth - width / 2,
    top: y * sizes.confettiAreaHeight - height / 2,
    backgroundColor: colors[color],
    transform: [{ rotate: `${angle ?? 0}deg` }],
  };
}

// The design's "Explosão" reward: a completed node of the module map, big, with confetti
// around it.
// Purely decorative; the screen's text says the lesson is done.
export function RewardBurst() {
  return (
    <View
      style={styles.area}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {pieces.map((piece, index) => (
        <Animated.View
          key={index}
          entering={FadeIn.delay(duration.stagger + index * (duration.stagger / 4))}
          style={[styles.piece, pieceStyle(piece)]}
        />
      ))}
      <Animated.View entering={ZoomIn.springify()}>
        <Medal icon="check" tone="success" size="xl" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizes.confettiAreaWidth,
    height: sizes.confettiAreaHeight,
  },
  piece: {
    position: 'absolute',
    borderRadius: radius.pill,
  },
});
