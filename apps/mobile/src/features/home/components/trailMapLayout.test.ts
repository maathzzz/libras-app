import type { LessonStatus, TrailLesson } from '@libras/contracts';

import {
  currentLessonIndex,
  initialScrollY,
  lessonPoints,
  mapLayout,
  reachedIndex,
  roadPath,
  sceneryTiles,
} from './trailMapLayout';

function lessons(...statuses: LessonStatus[]): TrailLesson[] {
  return statuses.map((status, index) => ({ id: `l${index}`, title: `Lição ${index}`, status }));
}

// The design's example: "Alfabeto e numerais", lesson 3 of 7 to do now, on a 390 pt screen.
const designModule = lessons(
  'completed',
  'completed',
  'available',
  'locked',
  'locked',
  'locked',
  'locked',
);

describe('module map layout', () => {
  it('alternates the nodes left and right of the middle, one step apart', () => {
    expect(lessonPoints(3, 390, 74)).toEqual([
      { x: 110, y: 74 },
      { x: 280, y: 202 },
      { x: 110, y: 330 },
    ]);
  });

  it('draws the road as the design does', () => {
    const points = lessonPoints(3, 390, 74);

    expect(roadPath(points)).toBe(
      'M110 74 C203.5 74 186.5 202 280 202 C186.5 202 203.5 330 110 330',
    );
  });

  it('has no road for a module without lessons and only a start point for one lesson', () => {
    expect(roadPath([])).toBe('');
    expect(roadPath([{ x: 110, y: 74 }])).toBe('M110 74');
  });

  it('matches the design for its example module', () => {
    const layout = mapLayout(designModule, 390);

    expect(layout.height).toBe(74 + 6 * 128 + 150);
    expect(layout.currentIndex).toBe(2);
    expect(layout.points[6]).toEqual({ x: 110, y: 842 });
    // The green stretch goes from the first lesson to the one to do now.
    expect(layout.roadDone).toBe(roadPath(layout.points.slice(0, 3)));
  });

  it('paints no green road before the first lesson is done', () => {
    expect(mapLayout(lessons('available', 'locked'), 390).roadDone).toBe('');
    expect(mapLayout(lessons('locked', 'locked'), 390).roadDone).toBe('');
  });

  it('paints the whole road green when every lesson is done', () => {
    const layout = mapLayout(lessons('completed', 'completed', 'completed'), 390);

    expect(layout.currentIndex).toBeNull();
    expect(layout.roadDone).toBe(layout.road);
  });

  it('starts lower when the balloon sits on the first lesson, so it is not cut off', () => {
    const fresh = mapLayout(lessons('available', 'locked'), 390);
    const started = mapLayout(lessons('completed', 'available'), 390);
    const first = fresh.points[0];
    if (!first) throw new Error('expected a first node');

    // Node radius, gap, balloon and its float must fit above the first node.
    expect(first.y - 36 - 16 - 44 - 5).toBeGreaterThan(0);
    expect(started.points[0]?.y).toBe(74);
    expect(fresh.height - started.height).toBe(first.y - 74);
  });

  it('finds the lesson to do now and the farthest one reached', () => {
    expect(currentLessonIndex(designModule)).toBe(2);
    expect(currentLessonIndex(lessons('completed', 'completed'))).toBeNull();
    expect(reachedIndex(designModule)).toBe(2);
    expect(reachedIndex(lessons('locked', 'locked'))).toBe(-1);
  });

  it('repeats the scenery every four lessons down to the end of the map', () => {
    expect(sceneryTiles(74, 992)).toEqual([250, 762]);
    expect(sceneryTiles(74, 250)).toEqual([]);
  });

  it('opens with the lesson to do now in the middle of the screen', () => {
    const layout = mapLayout(designModule, 390);

    expect(initialScrollY(layout, designModule, 400)).toBe(330 - 200);
  });

  it('never scrolls past the ends of the map', () => {
    const layout = mapLayout(designModule, 390);
    const done = lessons(...designModule.map((): LessonStatus => 'completed'));
    const doneLayout = mapLayout(done, 390);

    expect(initialScrollY(mapLayout(lessons('available'), 390), lessons('available'), 600)).toBe(0);
    expect(initialScrollY(doneLayout, done, 400)).toBe(doneLayout.height - 400);
    expect(initialScrollY(layout, designModule, 2000)).toBe(0);
  });
});
