import { G } from 'react-native-svg';

import { Cloud, Flower, Hill, Lake, Tree } from '@/shared/ui';

import { clouds, sceneryTile, sceneryX } from './trailSceneryLayout';

type TrailSceneryProps = {
  width: number;
  /** Tops of the repeated bands, from `mapLayout`. */
  tiles: readonly number[];
};

// Shapes follow the design's drawing (trilha-modulo-referencia.html). Decorative only: the
// parent Svg is hidden from screen readers.
export function TrailScenery({ width, tiles }: TrailSceneryProps) {
  return (
    <G>
      {tiles.map((top) => (
        <G key={`hills-${top}`}>
          {sceneryTile.hills.map((hill, index) => (
            <Hill
              key={index}
              cx={sceneryX(hill, width)}
              cy={top + hill.y}
              rx={hill.rx}
              ry={hill.ry}
              inner={hill.inner}
            />
          ))}
        </G>
      ))}
      {tiles.map((top) => (
        <G key={`items-${top}`}>
          {sceneryTile.lakes.map((lake, index) => (
            <Lake key={index} x={sceneryX(lake, width)} y={top + lake.y} />
          ))}
          {sceneryTile.trees.map((tree, index) => (
            <Tree key={index} x={sceneryX(tree, width)} y={top + tree.y} scale={tree.scale} />
          ))}
          {sceneryTile.flowers.map((flower, index) => (
            <Flower
              key={index}
              x={sceneryX(flower, width)}
              y={top + flower.y}
              color={flower.color}
            />
          ))}
        </G>
      ))}
      {clouds.map((cloud, index) => (
        <Cloud key={index} x={sceneryX(cloud, width)} y={cloud.y} scale={cloud.scale} />
      ))}
    </G>
  );
}
