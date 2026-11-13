import type { StreakSummary, Trail, TrailLesson, TrailUnit } from '@libras/contracts';

const xpFormat = new Intl.NumberFormat('pt-BR');

export function formatXp(xp: number): string {
  return xpFormat.format(xp);
}

export function lessonsLabel(count: number): string {
  return `${count} ${count === 1 ? 'lição' : 'lições'}`;
}

export function daysLabel(count: number): string {
  return `${count} ${count === 1 ? 'dia' : 'dias'}`;
}

export function completedLessons(unit: TrailUnit): number {
  return unit.lessons.filter((lesson) => lesson.status === 'completed').length;
}

export function percentLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function unitProgress(unit: TrailUnit): number {
  return completedLessons(unit) / unit.lessons.length;
}

// A module opens once one of its lessons is unlocked; the BFF decides which ones are.
export type UnitStatus = 'completed' | 'current' | 'locked';

export function unitStatus(unit: TrailUnit): UnitStatus {
  if (unit.lessons.every((lesson) => lesson.status === 'completed')) return 'completed';
  if (unit.lessons.some((lesson) => lesson.status !== 'locked')) return 'current';
  return 'locked';
}

export function unitKicker(index: number, unit: TrailUnit): string {
  const status = unitStatus(unit);
  const detail =
    status === 'completed'
      ? 'Concluído'
      : status === 'locked'
        ? 'Bloqueado'
        : `${completedLessons(unit)} de ${lessonsLabel(unit.lessons.length)}`;
  return `Módulo ${index + 1} · ${detail}`;
}

export function completedUnits(trail: Trail): number {
  return trail.units.filter((unit) => unitStatus(unit) === 'completed').length;
}

export function trailLessonCounts(trail: Trail): { completed: number; total: number } {
  return trail.units.reduce(
    (counts, unit) => ({
      completed: counts.completed + completedLessons(unit),
      total: counts.total + unit.lessons.length,
    }),
    { completed: 0, total: 0 },
  );
}

export function hasStartedTrail(trail: Trail): boolean {
  return trail.units.some((unit) => completedLessons(unit) > 0);
}

export type NextLesson = {
  unit: TrailUnit;
  lesson: TrailLesson;
  number: number;
};

export function findNextLesson(trail: Trail): NextLesson | null {
  for (const unit of trail.units) {
    const index = unit.lessons.findIndex((lesson) => lesson.status === 'available');
    const lesson = unit.lessons[index];
    if (lesson) return { unit, lesson, number: index + 1 };
  }
  return null;
}

export function nextLessonCopy({ unit, lesson, number }: NextLesson, isFirstLesson: boolean) {
  return {
    kicker: isFirstLesson ? 'Comece por aqui' : 'Continuar onde parou',
    title: `${unit.title} · Lição ${number}`,
    description: lesson.title,
    action: isFirstLesson ? 'Começar primeira lição' : 'Continuar lição',
  };
}

export function streakCopy({ status, longest }: StreakSummary) {
  if (status === 'done_today') {
    return { title: 'Sequência garantida hoje', hint: 'Volte amanhã para continuar.' };
  }
  if (status === 'at_risk') {
    return {
      title: 'Sua sequência está em risco',
      hint: 'Conclua uma lição hoje para não perder.',
    };
  }
  if (longest === 0) {
    return { title: 'Comece sua sequência', hint: 'Conclua uma lição hoje para começar.' };
  }
  return { title: 'Sua sequência zerou', hint: 'Conclua uma lição hoje para começar de novo.' };
}

const lessonStatusWords = {
  locked: 'bloqueada',
  completed: 'concluída',
  available: 'disponível',
} as const;

// `number` is the lesson's position in its module, starting at 1.
export function lessonAccessibilityLabel(lesson: TrailLesson, number: number): string {
  return `Lição ${number}, ${lesson.title}, ${lessonStatusWords[lesson.status]}`;
}
