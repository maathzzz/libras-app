import type { TrailLesson } from '@libras/contracts';

import { sizes } from '@/shared/theme';

// Geometry of the module map, the "trilha de aventura" of docs/design/trilha-modulo-spec.md
// (section 3). Values are in points and were drawn on a 390 pt wide screen; the nodes are
// placed from the middle of the screen, so they fit narrower phones too.

export type Point = { x: number; y: number };

export const trailMap = {
  // Nodes alternate left and right of the middle by this much.
  sideOffset: 85,
  firstY: 74,
  step: 128,
  // Room after the last node for its label and the scenery below it.
  bottomSpace: 150,
  // Horizontal pull of the curve's control points: the road leaves and reaches every node
  // flat, then bends between them.
  curve: 0.55,
  // Gap between the "Começar" balloon and the top of the node it points at, and how far
  // it floats up.
  balloonGap: 16,
  balloonFloat: 5,
  // Space kept above the balloon when it sits on the first lesson.
  balloonTopMargin: 12,
  // Gap between a node and the label under it.
  labelGap: 12,
  // The scenery repeats every four lessons, starting under the sky.
  sceneryStart: 176,
  sceneryRepeat: 4,
  road: {
    edge: 34,
    bed: 26,
    dots: 3.5,
    dotsDash: [0.5, 12],
    done: 10,
  },
} as const;

const nodeRadius = sizes.trailNode / 2;

export type TrailMapLayout = {
  width: number;
  height: number;
  points: Point[];
  // The lesson to start now, which gets the balloon. Null when none is available.
  currentIndex: number | null;
  // Whole road, and the stretch already walked (empty when there is none).
  road: string;
  roadDone: string;
  sceneryTiles: number[];
};

export function mapLayout(lessons: readonly TrailLesson[], width: number): TrailMapLayout {
  const currentIndex = currentLessonIndex(lessons);
  const firstY = currentIndex === 0 ? firstYUnderBalloon() : trailMap.firstY;
  const points = lessonPoints(lessons.length, width, firstY);
  const height = firstY + (lessons.length - 1) * trailMap.step + trailMap.bottomSpace;
  const reached = reachedIndex(lessons);

  return {
    width,
    height,
    points,
    currentIndex,
    road: roadPath(points),
    roadDone: reached > 0 ? roadPath(points.slice(0, reached + 1)) : '',
    sceneryTiles: sceneryTiles(firstY, height),
  };
}

export function currentLessonIndex(lessons: readonly TrailLesson[]): number | null {
  const index = lessons.findIndex((lesson) => lesson.status === 'available');
  return index === -1 ? null : index;
}

// The farthest lesson the learner can open: the green road goes up to it.
export function reachedIndex(lessons: readonly TrailLesson[]): number {
  return lessons.findLastIndex((lesson) => lesson.status !== 'locked');
}

// The balloon floats above its node; on the first lesson the map starts lower so the
// balloon is not cut by the top of the screen.
function firstYUnderBalloon(): number {
  const above =
    nodeRadius +
    trailMap.balloonGap +
    sizes.trailBalloonHeight +
    trailMap.balloonFloat +
    trailMap.balloonTopMargin;
  return Math.max(trailMap.firstY, above);
}

export function lessonPoints(count: number, width: number, firstY: number): Point[] {
  const middle = width / 2;
  return Array.from({ length: count }, (_, index) => ({
    x: index % 2 === 0 ? middle - trailMap.sideOffset : middle + trailMap.sideOffset,
    y: firstY + trailMap.step * index,
  }));
}

const round = (value: number) => Math.round(value * 100) / 100;

// One cubic curve between each pair of neighbors, with horizontal control points.
export function roadPath(points: readonly Point[]): string {
  const [first, ...rest] = points;
  if (!first) return '';

  const parts = [`M${round(first.x)} ${round(first.y)}`];
  let from = first;
  for (const to of rest) {
    const pull = trailMap.curve * (to.x - from.x);
    parts.push(
      `C${round(from.x + pull)} ${round(from.y)} ${round(to.x - pull)} ${round(to.y)} ${round(to.x)} ${round(to.y)}`,
    );
    from = to;
  }
  return parts.join(' ');
}

// Tops of the repeated scenery bands. Each band is as tall as four lessons, so it lines up
// with the nodes whatever their number.
export function sceneryTiles(firstY: number, height: number): number[] {
  const repeat = trailMap.step * trailMap.sceneryRepeat;
  const tops: number[] = [];
  for (let top = firstY + trailMap.sceneryStart; top < height; top += repeat) tops.push(top);
  return tops;
}

// Opening the screen shows the lesson to do now (or the last one reached) in the middle
// of the visible area, without scrolling past either end of the map.
export function initialScrollY(
  layout: TrailMapLayout,
  lessons: readonly TrailLesson[],
  viewportHeight: number,
): number {
  const focus = layout.currentIndex ?? Math.max(0, reachedIndex(lessons));
  const point = layout.points[focus];
  if (!point) return 0;

  const maxScroll = Math.max(0, layout.height - viewportHeight);
  return Math.min(maxScroll, Math.max(0, point.y - viewportHeight / 2));
}
