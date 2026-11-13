import type { TrailUnit } from '@libras/contracts';

import { moduleRoadPaths, reachedUnitIndex } from './moduleRoadLayout';

function unit(id: string, statuses: TrailUnit['lessons'][number]['status'][]): TrailUnit {
  return {
    id,
    title: id,
    lessons: statuses.map((status, index) => ({ id: `${id}-${index}`, title: 'Lição', status })),
  };
}

describe('moduleRoadLayout', () => {
  it('reaches the last module with an open lesson', () => {
    const units = [
      unit('a', ['completed', 'completed']),
      unit('b', ['completed', 'available']),
      unit('c', ['locked', 'locked']),
    ];

    expect(reachedUnitIndex(units)).toBe(1);
  });

  it('reaches no module when every lesson is locked', () => {
    expect(reachedUnitIndex([unit('a', ['locked'])])).toBe(-1);
  });

  it('runs the road down the rail from the first to the last node', () => {
    const paths = moduleRoadPaths([60, 190.123, 320], 36, 1);

    expect(paths.road).toBe('M36 60 L36 320');
    expect(paths.done).toBe('M36 60 L36 190.12');
  });

  it('has no walked stretch while only the first module is open', () => {
    expect(moduleRoadPaths([60, 190], 36, 0).done).toBe('');
    expect(moduleRoadPaths([60, 190], 36, -1).done).toBe('');
  });

  it('draws no road for a single module', () => {
    expect(moduleRoadPaths([60], 36, 0)).toEqual({ road: '', done: '' });
    expect(moduleRoadPaths([], 36, 0)).toEqual({ road: '', done: '' });
  });
});
