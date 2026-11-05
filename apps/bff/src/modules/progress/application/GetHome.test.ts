import type { TrailLesson } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { LocalDate } from '../../../shared/domain/LocalDate';
import { Streak } from '../domain/Streak';
import type { CatalogTrail } from '../domain/TrailCatalog';
import { emptyStats } from '../domain/UserStatsRepository';
import { InMemoryProgressStore } from '../testing/InMemoryProgressStore';
import { InMemoryTrailCatalog } from '../testing/InMemoryTrailCatalog';
import { GetHome } from './GetHome';

const userId = 'user-1';
const today = LocalDate.of(2026, 3, 15);

const trail: CatalogTrail = {
  id: 'libras-iniciante',
  title: 'Libras para iniciantes',
  position: 1,
  units: [
    {
      id: 'alfabeto',
      title: 'Alfabeto',
      lessons: [
        { id: 'vogais', title: 'Vogais' },
        { id: 'b-g', title: 'B a G' },
      ],
    },
    {
      id: 'saudacoes',
      title: 'Saudações',
      lessons: [
        { id: 'oi', title: 'Oi e tchau' },
        { id: 'bom-dia', title: 'Bom dia' },
      ],
    },
    // Not planned yet.
    { id: 'familia', title: 'Família', lessons: [] },
  ],
};

const laterTrail: CatalogTrail = {
  id: 'libras-basico',
  title: 'Libras básico',
  position: 2,
  units: [{ id: 'cores', title: 'Cores', lessons: [{ id: 'cores-1', title: 'Cores 1' }] }],
};

describe('GetHome', () => {
  let store: InMemoryProgressStore;
  let getHome: GetHome;

  beforeEach(() => {
    store = new InMemoryProgressStore();
    getHome = new GetHome(new InMemoryTrailCatalog([laterTrail, trail]), store, store);
  });

  const home = () => getHome.execute({ userId, today });

  // Lesson statuses of each unit, in order.
  const statusesOf = (units: { lessons: TrailLesson[] }[]) =>
    units.map((unit) => unit.lessons.map((lesson) => lesson.status));

  it('shows a new learner the first trail with only its first lesson available', async () => {
    const { trail: shown } = await home();

    expect(shown).toEqual({
      id: 'libras-iniciante',
      title: 'Libras para iniciantes',
      position: 1,
      totalTrails: 2,
      units: [
        {
          id: 'alfabeto',
          title: 'Alfabeto',
          lessons: [
            { id: 'vogais', title: 'Vogais', status: 'available' },
            { id: 'b-g', title: 'B a G', status: 'locked' },
          ],
        },
        {
          id: 'saudacoes',
          title: 'Saudações',
          lessons: [
            { id: 'oi', title: 'Oi e tchau', status: 'locked' },
            { id: 'bom-dia', title: 'Bom dia', status: 'locked' },
          ],
        },
      ],
    });
  });

  it('gives a new learner a zero streak and no XP', async () => {
    const { streak, totalXp } = await home();

    expect(streak).toEqual({ current: 0, longest: 0, status: 'broken' });
    expect(totalXp).toBe(0);
  });

  it('marks completed lessons and unlocks the one after them', async () => {
    store.seedCompletedLessons(userId, ['vogais']);

    const { trail: shown } = await home();

    expect(statusesOf(shown.units)).toEqual([
      ['completed', 'available'],
      ['locked', 'locked'],
    ]);
  });

  it('unlocks the first lesson of the next unit after the last one of the previous unit', async () => {
    store.seedCompletedLessons(userId, ['vogais', 'b-g']);

    const { trail: shown } = await home();

    expect(statusesOf(shown.units)).toEqual([
      ['completed', 'completed'],
      ['available', 'locked'],
    ]);
  });

  it('does not use the progress of other learners', async () => {
    store.seedCompletedLessons('user-2', ['vogais', 'b-g']);

    const { trail: shown } = await home();

    expect(statusesOf(shown.units)).toEqual([
      ['available', 'locked'],
      ['locked', 'locked'],
    ]);
  });

  it('returns the total XP', async () => {
    store.seedStats({ ...emptyStats(userId), totalXp: 1240 });

    expect((await home()).totalXp).toBe(1240);
  });

  describe('streak', () => {
    const seedStreak = (lastActivity: LocalDate) =>
      store.seedStats({
        ...emptyStats(userId),
        totalXp: 100,
        streak: Streak.restore({ current: 7, longest: 12, lastActivity }),
      });

    it('is done_today when the last lesson was today', async () => {
      seedStreak(today);

      expect((await home()).streak).toEqual({ current: 7, longest: 12, status: 'done_today' });
    });

    it('is at_risk when the last lesson was yesterday', async () => {
      seedStreak(today.minusDays(1));

      expect((await home()).streak).toEqual({ current: 7, longest: 12, status: 'at_risk' });
    });

    it('is broken and shows 0 after a skipped day, keeping the longest', async () => {
      seedStreak(today.minusDays(2));

      expect((await home()).streak).toEqual({ current: 0, longest: 12, status: 'broken' });
    });

    it('uses the date sent by the device, not the server clock', async () => {
      seedStreak(LocalDate.of(2026, 2, 28));

      const streak = await getHome.execute({ userId, today: LocalDate.of(2026, 3, 1) });

      expect(streak.streak.status).toBe('at_risk');
    });
  });

  it('fails when there is no trail to show', async () => {
    const empty = new GetHome(new InMemoryTrailCatalog([]), store, store);

    await expect(empty.execute({ userId, today })).rejects.toThrow('No trail');
  });
});
