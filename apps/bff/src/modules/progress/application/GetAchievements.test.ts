import { beforeEach, describe, expect, it } from 'vitest';

import type { CatalogTrail } from '../domain/TrailCatalog';
import { emptyStats } from '../domain/UserStatsRepository';
import { InMemoryProgressStore } from '../testing/InMemoryProgressStore';
import { InMemoryTrailCatalog } from '../testing/InMemoryTrailCatalog';
import { GetAchievements } from './GetAchievements';

const userId = 'user-1';

const trail: CatalogTrail = {
  id: 'trail',
  title: 'Trilha',
  position: 1,
  units: [
    {
      id: 'unit-1',
      title: 'Módulo 1',
      lessons: [
        { id: 'l1', title: 'Lição 1' },
        { id: 'l2', title: 'Lição 2' },
      ],
    },
  ],
};

describe('GetAchievements', () => {
  let store: InMemoryProgressStore;

  beforeEach(() => {
    store = new InMemoryProgressStore();
  });

  const achievements = async () => {
    const response = await new GetAchievements(
      new InMemoryTrailCatalog([trail]),
      store,
      store,
      store,
    ).execute({ userId });
    return response.achievements;
  };

  const find = async (id: string) => (await achievements()).find((entry) => entry.id === id);

  it('lists the whole catalog locked for a new learner', async () => {
    const list = await achievements();

    expect(list).toHaveLength(15);
    expect(list.every(({ unlockedAt }) => unlockedAt === null)).toBe(true);
    expect(list.every(({ progress }) => progress.current === 0)).toBe(true);
  });

  it('shows the progress towards a locked achievement', async () => {
    store.seedStats({ ...emptyStats(userId), totalXp: 45, lessonsCompleted: 4 });

    expect(await find('xp-100')).toMatchObject({
      progress: { current: 45, target: 100 },
      unlockedAt: null,
    });
    expect(await find('lessons-10')).toMatchObject({ progress: { current: 4, target: 10 } });
  });

  it('shows the unlock date of an unlocked achievement', async () => {
    const unlockedAt = new Date('2026-03-15T15:00:00.000Z');
    store.seedStats({ ...emptyStats(userId), lessonsCompleted: 1 });
    store.seedAchievements(userId, [{ achievementId: 'first-lesson', unlockedAt }]);

    expect(await find('first-lesson')).toEqual({
      id: 'first-lesson',
      title: 'Primeiro sinal',
      description: 'Conclua sua primeira lição.',
      category: 'lessons',
      progress: { current: 1, target: 1 },
      unlockedAt: '2026-03-15T15:00:00.000Z',
    });
  });

  // Reached before the achievement existed: unlocked only by the next lesson.
  it('does not unlock on read', async () => {
    store.seedStats({ ...emptyStats(userId), lessonsCompleted: 1 });

    expect(await find('first-lesson')).toMatchObject({
      progress: { current: 1, target: 1 },
      unlockedAt: null,
    });
    expect(await store.findUnlocked(userId)).toEqual([]);
  });

  it('counts the completed units of the trail', async () => {
    store.seedCompletedLessons(userId, ['l1', 'l2']);

    expect(await find('modules-3')).toMatchObject({ progress: { current: 1, target: 3 } });
    expect(await find('trail-complete')).toMatchObject({ progress: { current: 1, target: 1 } });
  });
});
