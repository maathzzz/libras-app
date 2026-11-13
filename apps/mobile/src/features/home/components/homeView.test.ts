import type { Trail } from '@libras/contracts';

import { mockTrail } from '../api/homeFixtures';
import {
  completedUnits,
  daysLabel,
  findNextLesson,
  formatXp,
  hasStartedTrail,
  lessonAccessibilityLabel,
  lessonsLabel,
  nextLessonCopy,
  percentLabel,
  streakCopy,
  trailLessonCounts,
  unitKicker,
  unitProgress,
  unitStatus,
} from './homeView';

const newUserTrail: Trail = {
  ...mockTrail,
  units: mockTrail.units.map((unit, unitIndex) => ({
    ...unit,
    lessons: unit.lessons.map((lesson, index) => ({
      ...lesson,
      status: unitIndex === 0 && index === 0 ? 'available' : 'locked',
    })),
  })),
};

describe('homeView', () => {
  it('formats XP with the Brazilian thousands separator', () => {
    expect(formatXp(1240)).toBe('1.240');
  });

  it('pluralizes lessons and days', () => {
    expect(lessonsLabel(1)).toBe('1 lição');
    expect(lessonsLabel(4)).toBe('4 lições');
    expect(daysLabel(1)).toBe('1 dia');
    expect(daysLabel(12)).toBe('12 dias');
  });

  it('finds the first available lesson with its number in the unit', () => {
    const next = findNextLesson(mockTrail);

    expect(next?.unit.title).toBe('Saudações');
    expect(next?.lesson.id).toBe('saudacoes-bom-dia');
    expect(next?.number).toBe(2);
  });

  it('finds no next lesson when none is available', () => {
    const units = mockTrail.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => ({ ...lesson, status: 'completed' as const })),
    }));

    expect(findNextLesson({ ...mockTrail, units })).toBeNull();
  });

  it('invites a new user to start and a returning user to continue', () => {
    const first = findNextLesson(newUserTrail);
    const next = findNextLesson(mockTrail);
    if (!first || !next) throw new Error('expected an available lesson');

    expect(hasStartedTrail(newUserTrail)).toBe(false);
    expect(nextLessonCopy(first, true)).toMatchObject({
      kicker: 'Comece por aqui',
      title: 'Alfabeto A–F · Lição 1',
    });
    expect(hasStartedTrail(mockTrail)).toBe(true);
    expect(nextLessonCopy(next, false)).toMatchObject({
      kicker: 'Continuar onde parou',
      title: 'Saudações · Lição 2',
      description: 'Bom dia',
    });
  });

  it('gives each streak status its own message', () => {
    const titles = [
      streakCopy({ current: 8, longest: 12, status: 'done_today' }).title,
      streakCopy({ current: 7, longest: 12, status: 'at_risk' }).title,
      streakCopy({ current: 0, longest: 12, status: 'broken' }).title,
      streakCopy({ current: 0, longest: 0, status: 'broken' }).title,
    ];

    expect(new Set(titles).size).toBe(titles.length);
  });

  it('describes each lesson for screen readers with its number in the module', () => {
    expect(lessonAccessibilityLabel({ id: 'a', title: 'Oi', status: 'completed' }, 1)).toBe(
      'Lição 1, Oi, concluída',
    );
    expect(lessonAccessibilityLabel({ id: 'b', title: 'H a M', status: 'available' }, 3)).toBe(
      'Lição 3, H a M, disponível',
    );
    expect(lessonAccessibilityLabel({ id: 'c', title: 'Casa', status: 'locked' }, 4)).toBe(
      'Lição 4, Casa, bloqueada',
    );
  });

  it('marks a module done, in progress or locked from its lessons', () => {
    const [alphabet, greetings, numbers] = mockTrail.units;
    if (!alphabet || !greetings || !numbers) throw new Error('expected three units');

    expect(unitStatus(alphabet)).toBe('completed');
    expect(unitStatus(greetings)).toBe('current');
    expect(unitStatus(numbers)).toBe('locked');
    expect(unitKicker(0, alphabet)).toBe('Módulo 1 · Concluído');
    expect(unitKicker(1, greetings)).toBe('Módulo 2 · 1 de 4 lições');
    expect(unitKicker(2, numbers)).toBe('Módulo 3 · Bloqueado');
  });

  it('keeps a module open when its next lesson is available but none is done', () => {
    const [first] = newUserTrail.units;
    if (!first) throw new Error('expected a unit');

    expect(unitStatus(first)).toBe('current');
    expect(unitProgress(first)).toBe(0);
  });

  it('sums the progress of the whole trail', () => {
    const [, greetings] = mockTrail.units;
    if (!greetings) throw new Error('expected a unit');

    expect(completedUnits(mockTrail)).toBe(1);
    expect(trailLessonCounts(mockTrail)).toEqual({ completed: 4, total: 11 });
    expect(percentLabel(unitProgress(greetings))).toBe('25%');
  });
});
