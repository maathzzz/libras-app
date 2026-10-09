import type { NextLesson, StreakStatus, Trail, TrailUnit } from '@libras/contracts';

const xpFormat = new Intl.NumberFormat('pt-BR');

export function formatXp(xp: number): string {
  return xpFormat.format(xp);
}

export function lessonsLabel(count: number): string {
  return `${count} ${count === 1 ? 'lição' : 'lições'}`;
}

export function hasStartedTrail(trail: Trail): boolean {
  return trail.units.some((unit) => unit.completedLessons > 0);
}

export function nextLessonCopy(lesson: NextLesson, isFirstLesson: boolean) {
  return {
    kicker: isFirstLesson ? 'Comece por aqui' : 'Continuar onde parou',
    title: `${lesson.unitTitle} · Lição ${lesson.lessonNumber}`,
    description: `${lesson.newSignsCount} sinais novos · ${lesson.xpReward} XP em jogo`,
    action: isFirstLesson ? 'Começar primeira lição' : 'Continuar lição',
  };
}

export function dailyGoalHint(status: StreakStatus, hasStarted: boolean): string {
  if (status === 'done_today') return 'Sequência garantida hoje. Volte amanhã!';
  if (status === 'at_risk') return 'Conclua uma lição hoje para manter a sequência.';
  if (!hasStarted) return 'Conclua sua primeira lição hoje para iniciar a sequência.';
  return 'Conclua uma lição hoje para começar uma nova sequência.';
}

export function unitAccessibilityLabel(unit: TrailUnit): string {
  if (unit.status === 'locked') return `${unit.title}, bloqueada`;
  if (unit.status === 'done') return `${unit.title}, concluída`;
  return `${unit.title}, ${unit.completedLessons} de ${lessonsLabel(unit.totalLessons)}`;
}
