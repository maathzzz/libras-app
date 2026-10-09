import { describe, expect, it } from 'vitest';

import { HomeResponse } from './home';

const home = {
  trail: {
    id: 'trail-1',
    title: 'Primeiros contatos',
    position: 1,
    totalTrails: 6,
    units: [
      {
        id: 'u1',
        title: 'Saudações',
        lessons: [
          { id: 'l1', title: 'Oi e tchau', status: 'completed' },
          { id: 'l2', title: 'Bom dia', status: 'available' },
          { id: 'l3', title: 'Obrigado', status: 'locked' },
        ],
      },
    ],
  },
  streak: { current: 7, longest: 12, status: 'at_risk' },
  totalXp: 1240,
  today: { completedLessons: 2, dailyGoal: 3 },
};

describe('HomeResponse', () => {
  it('accepts a valid home', () => {
    expect(HomeResponse.parse(home)).toEqual(home);
  });

  it('rejects an unknown lesson status', () => {
    const lessons = [{ id: 'l1', title: 'Oi', status: 'started' }];
    const units = [{ id: 'u1', title: 'Saudações', lessons }];

    expect(HomeResponse.safeParse({ ...home, trail: { ...home.trail, units } }).success).toBe(
      false,
    );
  });

  it('rejects a unit without lessons', () => {
    const units = [{ id: 'u1', title: 'Saudações', lessons: [] }];

    expect(HomeResponse.safeParse({ ...home, trail: { ...home.trail, units } }).success).toBe(
      false,
    );
  });

  it('rejects an unknown streak status', () => {
    const streak = { current: 7, longest: 12, status: 'frozen' };

    expect(HomeResponse.safeParse({ ...home, streak }).success).toBe(false);
  });

  it('rejects a longest streak lower than the current one', () => {
    const result = HomeResponse.safeParse({
      ...home,
      streak: { current: 7, longest: 3, status: 'done_today' },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['streak', 'longest']);
  });
});
