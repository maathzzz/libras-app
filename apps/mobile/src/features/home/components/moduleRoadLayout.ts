import type { TrailUnit } from '@libras/contracts';

import { unitStatus } from './homeView';

// The road of the home's module list: a straight stretch of the module map's road down a
// rail at the left, through the center of every module node. The rows can grow with the
// text (long titles, large fonts), so the centers are measured on screen and passed in.

const round = (value: number) => Math.round(value * 100) / 100;

// The farthest module the learner can open: the green road goes up to it.
export function reachedUnitIndex(units: readonly TrailUnit[]): number {
  return units.findLastIndex((unit) => unitStatus(unit) !== 'locked');
}

function line(x: number, fromY: number, toY: number): string {
  return `M${round(x)} ${round(fromY)} L${round(x)} ${round(toY)}`;
}

// A single module has no road; the walked stretch is empty until a second module opens.
export function moduleRoadPaths(
  centers: readonly number[],
  x: number,
  reached: number,
): { road: string; done: string } {
  const first = centers[0];
  const last = centers[centers.length - 1];
  if (first === undefined || last === undefined || centers.length < 2) {
    return { road: '', done: '' };
  }

  const reachedY = centers[reached];
  return {
    road: line(x, first, last),
    done: reached > 0 && reachedY !== undefined ? line(x, first, reachedY) : '',
  };
}
