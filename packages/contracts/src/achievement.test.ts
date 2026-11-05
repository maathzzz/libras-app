import { describe, expect, it } from 'vitest';

import { AchievementsResponse } from './achievement';

const unlocked = {
  id: 'first-lesson',
  title: 'Primeiro sinal',
  description: 'Conclua sua primeira lição.',
  category: 'lessons',
  progress: { current: 1, target: 1 },
  unlockedAt: '2026-03-15T15:00:00.000Z',
};

const locked = {
  id: 'xp-100',
  title: '100 XP',
  description: 'Alcance 100 XP.',
  category: 'xp',
  progress: { current: 45, target: 100 },
  unlockedAt: null,
};

describe('AchievementsResponse', () => {
  it('accepts unlocked and locked achievements', () => {
    const response = { achievements: [unlocked, locked] };

    expect(AchievementsResponse.parse(response)).toEqual(response);
  });

  it('rejects progress beyond the target', () => {
    const achievements = [{ ...locked, progress: { current: 120, target: 100 } }];

    expect(AchievementsResponse.safeParse({ achievements }).success).toBe(false);
  });

  it('rejects an unknown category', () => {
    const achievements = [{ ...locked, category: 'speed' }];

    expect(AchievementsResponse.safeParse({ achievements }).success).toBe(false);
  });
});
