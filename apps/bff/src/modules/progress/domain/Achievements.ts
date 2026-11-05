import type { Achievement, AchievementProgress } from '@libras/contracts';

import type { CatalogTrail } from './TrailCatalog';
import type { UserStats } from './UserStatsRepository';

// What the rules look at. Every value only grows with lesson completions, so checking the
// rules right after each one is enough: no job needs to look for achievements later.
export interface AchievementSnapshot {
  lessonsCompleted: number;
  perfectLessons: number;
  // Completions of a lesson that had already been completed.
  lessonsRedone: number;
  totalXp: number;
  // The longest one, so a broken streak does not take back the progress shown.
  longestStreak: number;
  completedUnits: number;
  completedTrails: number;
}

type Metric = keyof AchievementSnapshot;

export interface AchievementDefinition extends Achievement {
  metric: Metric;
  target: number;
}

// Display order. Ids are stored in user_achievements: never rename or reuse one. Titles and
// descriptions are provisional and can change freely.
export const achievementCatalog: readonly AchievementDefinition[] = [
  {
    id: 'first-lesson',
    title: 'Primeiro sinal',
    description: 'Conclua sua primeira lição.',
    category: 'lessons',
    metric: 'lessonsCompleted',
    target: 1,
  },
  {
    id: 'lessons-10',
    title: 'Pegando o ritmo',
    description: 'Conclua 10 lições.',
    category: 'lessons',
    metric: 'lessonsCompleted',
    target: 10,
  },
  {
    id: 'lessons-50',
    title: 'Mãos incansáveis',
    description: 'Conclua 50 lições.',
    category: 'lessons',
    metric: 'lessonsCompleted',
    target: 50,
  },
  {
    id: 'first-perfect',
    title: 'Sem errar nada',
    description: 'Conclua uma lição sem nenhum erro.',
    category: 'perfect',
    metric: 'perfectLessons',
    target: 1,
  },
  {
    id: 'perfect-10',
    title: 'Olhar afiado',
    description: 'Conclua 10 lições sem nenhum erro.',
    category: 'perfect',
    metric: 'perfectLessons',
    target: 10,
  },
  {
    id: 'first-review',
    title: 'Revisão',
    description: 'Refaça uma lição que você já concluiu.',
    category: 'review',
    metric: 'lessonsRedone',
    target: 1,
  },
  {
    id: 'xp-100',
    title: 'Em ascensão',
    description: 'Alcance 100 XP.',
    category: 'xp',
    metric: 'totalXp',
    target: 100,
  },
  {
    id: 'xp-500',
    title: 'Dedicação',
    description: 'Alcance 500 XP.',
    category: 'xp',
    metric: 'totalXp',
    target: 500,
  },
  {
    id: 'xp-1000',
    title: 'Mil pontos',
    description: 'Alcance 1.000 XP.',
    category: 'xp',
    metric: 'totalXp',
    target: 1000,
  },
  {
    id: 'streak-3',
    title: 'Aquecendo',
    description: 'Mantenha uma sequência de 3 dias.',
    category: 'streak',
    metric: 'longestStreak',
    target: 3,
  },
  {
    id: 'streak-7',
    title: 'Uma semana de Libras',
    description: 'Mantenha uma sequência de 7 dias.',
    category: 'streak',
    metric: 'longestStreak',
    target: 7,
  },
  {
    id: 'streak-30',
    title: 'Hábito formado',
    description: 'Mantenha uma sequência de 30 dias.',
    category: 'streak',
    metric: 'longestStreak',
    target: 30,
  },
  {
    id: 'first-module',
    title: 'Módulo concluído',
    description: 'Conclua todas as lições de um módulo.',
    category: 'modules',
    metric: 'completedUnits',
    target: 1,
  },
  {
    id: 'modules-3',
    title: 'Meio caminho',
    description: 'Conclua 3 módulos.',
    category: 'modules',
    metric: 'completedUnits',
    target: 3,
  },
  {
    id: 'trail-complete',
    title: 'Curso completo',
    // The MVP has a single trail with 5 units; update the number if the curriculum changes.
    description: 'Conclua os 5 módulos.',
    category: 'modules',
    metric: 'completedTrails',
    target: 1,
  },
];

// A unit without lessons is still being planned: it is never complete, and neither is its trail.
function isUnitComplete(unit: CatalogTrail['units'][number], completed: ReadonlySet<string>) {
  return unit.lessons.length > 0 && unit.lessons.every((lesson) => completed.has(lesson.id));
}

export const Achievements = {
  // `trail` is the one the learner is following; the MVP has a single trail. Null when
  // there is none.
  snapshotOf(
    stats: UserStats,
    completedLessonIds: ReadonlySet<string>,
    trail: CatalogTrail | null,
  ): AchievementSnapshot {
    const units = trail?.units ?? [];
    const completedUnits = units.filter((unit) => isUnitComplete(unit, completedLessonIds)).length;

    return {
      lessonsCompleted: stats.lessonsCompleted,
      perfectLessons: stats.perfectLessons,
      lessonsRedone: Math.max(0, stats.lessonsCompleted - completedLessonIds.size),
      totalXp: stats.totalXp,
      longestStreak: stats.streak.longest,
      completedUnits,
      completedTrails: units.length > 0 && completedUnits === units.length ? 1 : 0,
    };
  },

  // Reached in the snapshot and not unlocked before, in display order.
  newlyUnlocked(
    snapshot: AchievementSnapshot,
    unlockedIds: ReadonlySet<string>,
  ): AchievementDefinition[] {
    return achievementCatalog.filter(
      (definition) =>
        !unlockedIds.has(definition.id) && snapshot[definition.metric] >= definition.target,
    );
  },

  // An unlocked achievement stays full even if its value drops (a lesson added to a unit
  // already completed, for instance): unlocking is permanent.
  progressOf(
    definition: AchievementDefinition,
    snapshot: AchievementSnapshot,
    unlocked: boolean,
  ): AchievementProgress {
    const { target } = definition;
    if (unlocked) return { current: target, target };
    return { current: Math.min(snapshot[definition.metric], target), target };
  },

  // Only the fields of the contract: the rule stays in the BFF.
  toContract({ id, title, description, category }: AchievementDefinition): Achievement {
    return { id, title, description, category };
  },
};
