import type { AchievementStatus } from '@libras/contracts';

import {
  achievementAccessibilityLabel,
  formatUnlockDate,
  progressLabel,
  unlockedCount,
  unlockedTitle,
} from './achievementView';

const locked: AchievementStatus = {
  id: 'xp-1000',
  title: 'Mil pontos',
  description: 'Alcance 1.000 XP.',
  category: 'xp',
  progress: { current: 450, target: 1000 },
  unlockedAt: null,
};

// Noon UTC is the same calendar day in every Brazilian zone.
const unlocked: AchievementStatus = {
  id: 'first-lesson',
  title: 'Primeiro sinal',
  description: 'Conclua sua primeira lição.',
  category: 'lessons',
  progress: { current: 1, target: 1 },
  unlockedAt: '2026-03-05T12:00:00.000Z',
};

describe('unlockedCount', () => {
  it('counts only the unlocked achievements', () => {
    expect(unlockedCount([locked, unlocked])).toBe(1);
    expect(unlockedCount([])).toBe(0);
  });
});

describe('progressLabel', () => {
  it('shows the current value over the target with the pt-BR thousands separator', () => {
    expect(progressLabel({ current: 45, target: 100 })).toBe('45/100');
    expect(progressLabel({ current: 450, target: 1000 })).toBe('450/1.000');
  });
});

describe('formatUnlockDate', () => {
  it('shows day, month and year with two digits', () => {
    expect(formatUnlockDate('2026-03-05T12:00:00.000Z')).toBe('05/03/2026');
  });
});

describe('achievementAccessibilityLabel', () => {
  it('reads the unlock date of an unlocked achievement', () => {
    expect(achievementAccessibilityLabel(unlocked)).toBe(
      'Primeiro sinal. Conclua sua primeira lição. Conquistada em 05/03/2026.',
    );
  });

  it('reads the progress of a locked achievement', () => {
    expect(achievementAccessibilityLabel(locked)).toBe(
      'Mil pontos, bloqueada. Alcance 1.000 XP. Progresso: 450 de 1000.',
    );
  });
});

describe('unlockedTitle', () => {
  it('agrees with the number of achievements', () => {
    expect(unlockedTitle([unlocked])).toBe('Conquista desbloqueada!');
    expect(unlockedTitle([unlocked, locked])).toBe('Conquistas desbloqueadas!');
  });
});
