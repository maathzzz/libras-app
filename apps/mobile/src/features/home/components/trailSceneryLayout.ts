import { trailColors } from '@/shared/theme';

// Countryside drawn around the module map's road (docs/design/trilha-modulo-spec.md, 3.6).
// It stays in the margins, away from the nodes, so each item is placed by its distance
// (`inset`) from the left or right edge. A negative inset pushes it partly off the screen.

type Side = 'left' | 'right';

type Placed = {
  side: Side;
  inset: number;
  y: number;
};

export type Hill = Placed & { rx: number; ry: number; inner: boolean };
export type Tree = Placed & { scale: number };
export type Cloud = Placed & { scale: number };
export type Flower = Placed & { color: (typeof trailColors.flowers)[number] };
export type Lake = Placed;

export function sceneryX({ side, inset }: Placed, width: number): number {
  return side === 'left' ? inset : width - inset;
}

const [orange, white, teal, yellow] = trailColors.flowers;

// Drawn once, over the sky at the top of the map.
export const clouds: readonly Cloud[] = [
  { side: 'right', inset: 52, y: 44, scale: 1 },
  { side: 'right', inset: 154, y: 22, scale: 0.7 },
  { side: 'left', inset: 40, y: 200, scale: 0.8 },
];

// One band of scenery, four lessons tall, repeated down the map. The y values are from the
// top of the band. Big items (hills, the lake) sit level with the nodes of the other side.
export const sceneryTile = {
  hills: [
    { side: 'left', inset: -30, y: 200, rx: 95, ry: 70, inner: false },
    { side: 'left', inset: -10, y: 230, rx: 70, ry: 44, inner: true },
    { side: 'right', inset: -30, y: 370, rx: 100, ry: 76, inner: false },
    { side: 'right', inset: -10, y: 400, rx: 66, ry: 44, inner: true },
  ],
  lakes: [{ side: 'right', inset: 38, y: 100 }],
  trees: [
    { side: 'left', inset: 36, y: 50, scale: 1 },
    { side: 'left', inset: 18, y: 86, scale: 0.7 },
    { side: 'left', inset: 32, y: 310, scale: 0.9 },
    { side: 'left', inset: 30, y: 440, scale: 0.7 },
    { side: 'right', inset: 34, y: 30, scale: 0.85 },
    { side: 'right', inset: 28, y: 250, scale: 1 },
    { side: 'right', inset: 34, y: 490, scale: 0.8 },
  ],
  flowers: [
    { side: 'left', inset: 22, y: 0, color: teal },
    { side: 'left', inset: 50, y: 150, color: white },
    { side: 'left', inset: 18, y: 500, color: orange },
    { side: 'right', inset: 25, y: 170, color: yellow },
    { side: 'right', inset: 50, y: 290, color: orange },
    { side: 'right', inset: 18, y: 440, color: orange },
  ],
} satisfies {
  hills: readonly Hill[];
  lakes: readonly Lake[];
  trees: readonly Tree[];
  flowers: readonly Flower[];
};
