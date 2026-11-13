import { Circle, Defs, Ellipse, G, LinearGradient, Rect, Stop } from 'react-native-svg';

import { trailColors } from '@/shared/theme';

// The countryside of the module map (docs/design/trilha-modulo-spec.md, 3.6), drawn as
// react-native-svg shapes. They only render inside an <Svg>, which must be hidden from
// screen readers: the scenery is decorative. A tree or cloud at scale 1 is the biggest one
// of the design's drawing.

type SkyProps = {
  /** Unique within the screen: it names the gradient. */
  id: string;
  width: number;
  height: number;
  /** Where the sky turns into meadow, from the top. */
  skyHeight: number;
};

export function SkyGradient({ id, width, height, skyHeight }: SkyProps) {
  return (
    <>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
          <Stop offset={0} stopColor={trailColors.skyTop} />
          <Stop offset={Math.min(1, skyHeight / height)} stopColor={trailColors.meadow} />
          <Stop offset={1} stopColor={trailColors.meadowEnd} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
    </>
  );
}

type HillProps = { cx: number; cy: number; rx: number; ry: number; inner?: boolean };

export function Hill({ cx, cy, rx, ry, inner = false }: HillProps) {
  return (
    <Ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={inner ? trailColors.hillInner : trailColors.hill}
    />
  );
}

type ScaledProps = { x: number; y: number; scale: number };

// `y` is where the trunk meets the crown.
export function Tree({ x, y, scale: s }: ScaledProps) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 13 * s} rx={13 * s} ry={3.5 * s} fill={trailColors.treeShadow} />
      <Rect x={x - 3 * s} y={y} width={6 * s} height={13 * s} rx={2} fill={trailColors.trunk} />
      <Circle cx={x} cy={y - 6 * s} r={14 * s} fill={trailColors.treeTop} />
      <Circle cx={x - 5 * s} cy={y - 11 * s} r={6 * s} fill={trailColors.treeShine} />
    </G>
  );
}

export function Cloud({ x, y, scale: s }: ScaledProps) {
  return (
    <G fill={trailColors.cloud} opacity={0.95}>
      <Ellipse cx={x} cy={y} rx={30 * s} ry={11 * s} />
      <Circle cx={x - 9 * s} cy={y - 7 * s} r={11 * s} />
      <Circle cx={x + 8 * s} cy={y - 10 * s} r={14 * s} />
    </G>
  );
}

// The lake carries a pebble on its left bank.
export function Lake({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={46} ry={21} fill={trailColors.lake} />
      <Ellipse cx={x - 6} cy={y - 4} rx={30} ry={11} fill={trailColors.lakeShine} />
      <Ellipse cx={x - 52} cy={y + 18} rx={5} ry={3} fill={trailColors.stone} />
    </G>
  );
}

export type FlowerColor = (typeof trailColors.flowers)[number];

export function Flower({ x, y, color }: { x: number; y: number; color: FlowerColor }) {
  return (
    <G fill={color}>
      <Circle cx={x} cy={y} r={3.2} />
      <Circle cx={x + 7} cy={y + 4} r={2.4} opacity={0.8} />
    </G>
  );
}
