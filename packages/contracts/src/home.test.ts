import { describe, expect, it } from 'vitest';

import { HomeResponse } from './home';

const home = {
  streak: { current: 7, status: 'at_risk' },
  totalXp: 1240,
  dailyGoal: { target: 1, completedToday: 0 },
  trail: {
    id: 'trail-1',
    title: 'Primeiros contatos',
    position: 1,
    totalTrails: 6,
    units: [
      { id: 'u1', title: 'Alfabeto A–F', status: 'done', totalLessons: 6, completedLessons: 6 },
      { id: 'u2', title: 'Saudações', status: 'current', totalLessons: 5, completedLessons: 1 },
    ],
  },
  nextLesson: {
    lessonId: 'l2',
    unitTitle: 'Saudações',
    lessonNumber: 2,
    newSignsCount: 6,
    xpReward: 40,
  },
};

describe('HomeResponse', () => {
  it('accepts a valid home', () => {
    expect(HomeResponse.parse(home)).toEqual(home);
  });

  it('accepts a home without a next lesson', () => {
    expect(HomeResponse.safeParse({ ...home, nextLesson: null }).success).toBe(true);
  });

  it('rejects an unknown streak status', () => {
    const result = HomeResponse.safeParse({ ...home, streak: { current: 7, status: 'frozen' } });

    expect(result.success).toBe(false);
  });

  it('rejects a unit with more completed lessons than it has', () => {
    const units = [{ ...home.trail.units[0], completedLessons: 7 }];
    const result = HomeResponse.safeParse({ ...home, trail: { ...home.trail, units } });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['trail', 'units', 0, 'completedLessons']);
  });

  it('rejects a trail without units', () => {
    const result = HomeResponse.safeParse({ ...home, trail: { ...home.trail, units: [] } });

    expect(result.success).toBe(false);
  });
});
