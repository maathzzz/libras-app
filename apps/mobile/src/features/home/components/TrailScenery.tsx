import { Circle, Ellipse, G, Rect } from 'react-native-svg';

import { trailColors } from '@/shared/theme';

import {
  clouds,
  sceneryTile,
  sceneryX,
  type Cloud,
  type Flower,
  type Hill,
  type Lake,
  type Tree,
} from './trailSceneryLayout';

type TrailSceneryProps = {
  width: number;
  /** Tops of the repeated bands, from `mapLayout`. */
  tiles: readonly number[];
};

// Shapes follow the design's drawing (trilha-modulo-referencia.html); a tree or cloud at
// scale 1 is the biggest one there. Decorative only: the parent Svg is hidden from screen
// readers.
export function TrailScenery({ width, tiles }: TrailSceneryProps) {
  return (
    <G>
      {tiles.map((top) => (
        <G key={`hills-${top}`}>
          {sceneryTile.hills.map((hill, index) => (
            <HillShape key={index} hill={hill} x={sceneryX(hill, width)} y={top + hill.y} />
          ))}
        </G>
      ))}
      {tiles.map((top) => (
        <G key={`items-${top}`}>
          {sceneryTile.lakes.map((lake, index) => (
            <LakeShape key={index} lake={lake} x={sceneryX(lake, width)} y={top + lake.y} />
          ))}
          {sceneryTile.trees.map((tree, index) => (
            <TreeShape key={index} tree={tree} x={sceneryX(tree, width)} y={top + tree.y} />
          ))}
          {sceneryTile.flowers.map((flower, index) => (
            <FlowerShape
              key={index}
              flower={flower}
              x={sceneryX(flower, width)}
              y={top + flower.y}
            />
          ))}
        </G>
      ))}
      {clouds.map((cloud, index) => (
        <CloudShape key={index} cloud={cloud} x={sceneryX(cloud, width)} y={cloud.y} />
      ))}
    </G>
  );
}

type ShapeProps<T> = { x: number; y: number } & T;

function HillShape({ hill, x, y }: ShapeProps<{ hill: Hill }>) {
  return (
    <Ellipse
      cx={x}
      cy={y}
      rx={hill.rx}
      ry={hill.ry}
      fill={hill.inner ? trailColors.hillInner : trailColors.hill}
    />
  );
}

// `y` is where the trunk meets the crown.
function TreeShape({ tree, x, y }: ShapeProps<{ tree: Tree }>) {
  const s = tree.scale;
  return (
    <G>
      <Ellipse cx={x} cy={y + 13 * s} rx={13 * s} ry={3.5 * s} fill={trailColors.treeShadow} />
      <Rect x={x - 3 * s} y={y} width={6 * s} height={13 * s} rx={2} fill={trailColors.trunk} />
      <Circle cx={x} cy={y - 6 * s} r={14 * s} fill={trailColors.treeTop} />
      <Circle cx={x - 5 * s} cy={y - 11 * s} r={6 * s} fill={trailColors.treeShine} />
    </G>
  );
}

function CloudShape({ cloud, x, y }: ShapeProps<{ cloud: Cloud }>) {
  const s = cloud.scale;
  return (
    <G fill={trailColors.cloud} opacity={0.95}>
      <Ellipse cx={x} cy={y} rx={30 * s} ry={11 * s} />
      <Circle cx={x - 9 * s} cy={y - 7 * s} r={11 * s} />
      <Circle cx={x + 8 * s} cy={y - 10 * s} r={14 * s} />
    </G>
  );
}

// The lake carries a pebble on its left bank.
function LakeShape({ x, y }: ShapeProps<{ lake: Lake }>) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={46} ry={21} fill={trailColors.lake} />
      <Ellipse cx={x - 6} cy={y - 4} rx={30} ry={11} fill={trailColors.lakeShine} />
      <Ellipse cx={x - 52} cy={y + 18} rx={5} ry={3} fill={trailColors.stone} />
    </G>
  );
}

function FlowerShape({ flower, x, y }: ShapeProps<{ flower: Flower }>) {
  return (
    <G fill={flower.color}>
      <Circle cx={x} cy={y} r={3.2} />
      <Circle cx={x + 7} cy={y + 4} r={2.4} opacity={0.8} />
    </G>
  );
}
