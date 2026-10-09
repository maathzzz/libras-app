import { newUserHome, returningUserHome } from '../api/homeMocks';
import {
  dailyGoalHint,
  formatXp,
  hasStartedTrail,
  lessonsLabel,
  nextLessonCopy,
  unitAccessibilityLabel,
} from './homeCopy';

describe('homeCopy', () => {
  it('formats XP with the Brazilian thousands separator', () => {
    expect(formatXp(1240)).toBe('1.240');
  });

  it('pluralizes lessons', () => {
    expect(lessonsLabel(1)).toBe('1 lição');
    expect(lessonsLabel(5)).toBe('5 lições');
  });

  it('tells a new user apart from one who already completed lessons', () => {
    expect(hasStartedTrail(newUserHome.trail)).toBe(false);
    expect(hasStartedTrail(returningUserHome.trail)).toBe(true);
  });

  it('invites a new user to start the first lesson', () => {
    const copy = nextLessonCopy(newUserHome.nextLesson, true);

    expect(copy.kicker).toBe('Comece por aqui');
    expect(copy.title).toBe('Alfabeto A–F · Lição 1');
    expect(copy.action).toBe('Começar primeira lição');
  });

  it('invites a returning user to continue', () => {
    const copy = nextLessonCopy(returningUserHome.nextLesson, false);

    expect(copy.kicker).toBe('Continuar onde parou');
    expect(copy.description).toBe('6 sinais novos · 40 XP em jogo');
  });

  it('explains what keeps the streak for each status', () => {
    expect(dailyGoalHint('done_today', true)).toMatch(/garantida/);
    expect(dailyGoalHint('at_risk', true)).toMatch(/manter a sequência/);
    expect(dailyGoalHint('broken', false)).toMatch(/primeira lição/);
    expect(dailyGoalHint('broken', true)).toMatch(/nova sequência/);
  });

  it('describes each trail unit for screen readers', () => {
    const [done, current, locked] = returningUserHome.trail.units;

    expect(done && unitAccessibilityLabel(done)).toBe('Alfabeto A–F, concluída');
    expect(current && unitAccessibilityLabel(current)).toBe('Saudações, 1 de 5 lições');
    expect(locked && unitAccessibilityLabel(locked)).toBe('Números 0–10, bloqueada');
  });
});
