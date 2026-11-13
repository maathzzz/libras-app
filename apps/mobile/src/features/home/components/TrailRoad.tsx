import { Path } from 'react-native-svg';

import { trailColors } from '@/shared/theme';

import { trailMap } from './trailMapLayout';

type TrailRoadProps = {
  /** SVG path of the whole road. */
  road: string;
  /** The stretch already walked, drawn green on top; empty when there is none. */
  done: string;
};

// Edge, bed and dotted middle line along the whole road, then the green stretch already
// walked on top. Renders inside an <Svg>.
export function TrailRoad({ road, done }: TrailRoadProps) {
  const sizes = trailMap.road;
  return (
    <>
      <RoadLayer d={road} color={trailColors.roadEdge} width={sizes.edge} />
      <RoadLayer d={road} color={trailColors.roadBed} width={sizes.bed} />
      <RoadLayer d={road} color={trailColors.roadDots} width={sizes.dots} dash={sizes.dotsDash} />
      {done !== '' && <RoadLayer d={done} color={trailColors.roadDone} width={sizes.done} />}
    </>
  );
}

type RoadLayerProps = {
  d: string;
  color: string;
  width: number;
  dash?: readonly number[];
};

function RoadLayer({ d, color, width, dash }: RoadLayerProps) {
  return (
    <Path
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      {...(dash && { strokeDasharray: dash })}
      fill="none"
    />
  );
}
