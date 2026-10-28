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

export function lessonAccessibilityLabel(lesson: TrailLesson): string {
  if (lesson.status === 'locked') return `${lesson.title}, bloqueada`;
  if (lesson.status === 'completed') return `${lesson.title}, concluída`;
  return `${lesson.title}, disponível`;
}
