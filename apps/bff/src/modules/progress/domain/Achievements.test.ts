import { describe, expect, it } from 'vitest';

import { LocalDate } from '../../../shared/domain/LocalDate';
import { achievementCatalog, Achievements, type AchievementSnapshot } from './Achievements';
import { Streak } from './Streak';
import type { CatalogTrail } from './TrailCatalog';
import { emptyStats, type UserStats } from './UserStatsRepository';

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
    { id: 'unit-2', title: 'Módulo 2', lessons: [{ id: 'l3', title: 'Lição 3' }] },
  ],
};

const stats = (overrides: Partial<UserStats> = {}): UserStats => ({
  ...emptyStats('user-1'),
  ...overrides,
});

const zero: AchievementSnapshot = {
  lessonsCompleted: 0,
  perfectLessons: 0,
  lessonsRedone: 0,
  totalXp: 0,
  longestStreak: 0,
  completedUnits: 0,
  completedTrails: 0,
};

const ids = (definitions: readonly { id: string }[]) => definitions.map(({ id }) => id);

describe('achievementCatalog', () => {
  it('has 15 achievements with unique ids', () => {
    expect(achievementCatalog).toHaveLength(15);
    expect(new Set(ids(achievementCatalog)).size).toBe(15);
  });
});

describe('Achievements.snapshotOf', () => {
  it('counts the redone lessons as completions beyond the distinct lessons', () => {
    const snapshot = Achievements.snapshotOf(
      stats({ lessonsCompleted: 5, perfectLessons: 2, totalXp: 60 }),
      new Set(['l1', 'l2']),
      trail,
    );

    expect(snapshot).toMatchObject({
      lessonsCompleted: 5,
      perfectLessons: 2,
      lessonsRedone: 3,
      totalXp: 60,
    });
  });

  it('uses the longest streak, so a broken one keeps its progress', () => {
    const streak = Streak.restore({
      current: 2,
      longest: 9,
      lastActivity: LocalDate.of(2026, 3, 1),
    });

    expect(Achievements.snapshotOf(stats({ streak }), new Set(), trail).longestStreak).toBe(9);
  });

  it('counts a unit as complete only when all of its lessons are', () => {
    const snapshot = Achievements.snapshotOf(stats(), new Set(['l1', 'l3']), trail);

    expect(snapshot.completedUnits).toBe(1);
    expect(snapshot.completedTrails).toBe(0);
  });

  it('completes the trail when every unit is complete', () => {
    const snapshot = Achievements.snapshotOf(stats(), new Set(['l1', 'l2', 'l3']), trail);

    expect(snapshot.completedUnits).toBe(2);
    expect(snapshot.completedTrails).toBe(1);
  });

  // Units without lessons are still being planned: finishing the others is not the trail.
  it('never completes a unit without lessons, nor its trail', () => {
    const planned: CatalogTrail = {
      ...trail,
      units: [...trail.units, { id: 'unit-3', title: 'Módulo 3', lessons: [] }],
    };

    const snapshot = Achievements.snapshotOf(stats(), new Set(['l1', 'l2', 'l3']), planned);

    expect(snapshot.completedUnits).toBe(2);
    expect(snapshot.completedTrails).toBe(0);
  });

  it('has no completed units without a trail', () => {
    const snapshot = Achievements.snapshotOf(stats(), new Set(['l1']), null);

    expect(snapshot.completedUnits).toBe(0);
    expect(snapshot.completedTrails).toBe(0);
  });
});

describe('Achievements.newlyUnlocked', () => {
  it('unlocks nothing without progress', () => {
    expect(Achievements.newlyUnlocked(zero, new Set())).toEqual([]);
  });

  it('unlocks every achievement whose target is reached, in display order', () => {
    const snapshot = { ...zero, lessonsCompleted: 10, totalXp: 120, longestStreak: 3 };

    expect(ids(Achievements.newlyUnlocked(snapshot, new Set()))).toEqual([
      'first-lesson',
      'lessons-10',
      'xp-100',
      'streak-3',
    ]);
  });

  it('skips achievements already unlocked', () => {
    const snapshot = { ...zero, lessonsCompleted: 10 };

    expect(ids(Achievements.newlyUnlocked(snapshot, new Set(['first-lesson'])))).toEqual([
      'lessons-10',
    ]);
  });

  it('does not unlock one step below the target', () => {
    const snapshot = { ...zero, totalXp: 99, longestStreak: 6 };

    expect(ids(Achievements.newlyUnlocked(snapshot, new Set()))).toEqual(['streak-3']);
  });
});

describe('Achievements.progressOf', () => {
  const xp100 = achievementCatalog.find(({ id }) => id === 'xp-100');
  if (!xp100) throw new Error('xp-100 is missing from the catalog');

  it('shows the current value while locked', () => {
    expect(Achievements.progressOf(xp100, { ...zero, totalXp: 45 }, false)).toEqual({
      current: 45,
      target: 100,
    });
  });

  it('stops at the target', () => {
    expect(Achievements.progressOf(xp100, { ...zero, totalXp: 450 }, false)).toEqual({
      current: 100,
      target: 100,
    });
  });

  it('stays full once unlocked, even if the value dropped', () => {
    expect(Achievements.progressOf(xp100, zero, true)).toEqual({ current: 100, target: 100 });
  });
});
