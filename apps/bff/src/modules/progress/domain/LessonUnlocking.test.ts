import { describe, expect, it } from 'vitest';

import { LessonUnlocking } from './LessonUnlocking';

// Two units flattened in trail order: u1 has l1 and l2, u2 has l3 and l4.
const trailOrder = ['l1', 'l2', 'l3', 'l4'];

const statuses = (completed: string[], order = trailOrder) =>
  Object.fromEntries(LessonUnlocking.statusesOf(order, new Set(completed)));

describe('LessonUnlocking.statusesOf', () => {
  it('starts with only the first lesson available', () => {
    expect(statuses([])).toEqual({
      l1: 'available',
      l2: 'locked',
      l3: 'locked',
      l4: 'locked',
    });
  });

  it('unlocks the next lesson when one is completed', () => {
    expect(statuses(['l1'])).toEqual({
      l1: 'completed',
      l2: 'available',
      l3: 'locked',
      l4: 'locked',
    });
  });

  it('unlocks the first lesson of the next unit after the last one of the previous unit', () => {
    expect(statuses(['l1', 'l2'])).toEqual({
      l1: 'completed',
      l2: 'completed',
      l3: 'available',
      l4: 'locked',
    });
  });

  it('keeps every lesson completed once the trail is finished', () => {
    expect(statuses(trailOrder)).toEqual({
      l1: 'completed',
      l2: 'completed',
      l3: 'completed',
      l4: 'completed',
    });
  });

  it('keeps a completed lesson accessible even when the one before it is not completed', () => {
    // A lesson added before others the learner already finished.
    const order = ['l1', 'new', 'l2', 'l3'];

    expect(statuses(['l1', 'l2'], order)).toEqual({
      l1: 'completed',
      new: 'available',
      l2: 'completed',
      l3: 'available',
    });
  });

  it('ignores completed lessons that are not in the trail', () => {
    expect(statuses(['removed'])).toEqual({
      l1: 'available',
      l2: 'locked',
      l3: 'locked',
      l4: 'locked',
    });
  });

  it('returns nothing for a trail without lessons', () => {
    expect(statuses([], [])).toEqual({});
  });
});
