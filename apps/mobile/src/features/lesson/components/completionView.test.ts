import {
  durationAccessibilityLabel,
  formatDuration,
  resultAnnouncement,
  streakResultCopy,
} from './completionView';

const result = (current: number, streakIncreased: boolean) => ({
  xpEarned: 50,
  streak: { current, longest: 12, status: 'done_today' as const },
  streakIncreased,
});

describe('formatDuration', () => {
  it('shows minutes and two-digit seconds', () => {
    expect(formatDuration(134_000)).toBe('2:14');
    expect(formatDuration(5_000)).toBe('0:05');
  });

  it('rounds to the nearest second', () => {
    expect(formatDuration(59_600)).toBe('1:00');
  });

  it('never goes below zero', () => {
    expect(formatDuration(-1)).toBe('0:00');
  });
});

describe('durationAccessibilityLabel', () => {
  it('reads minutes and seconds in words', () => {
    expect(durationAccessibilityLabel(134_000)).toBe('2 minutos e 14 segundos');
    expect(durationAccessibilityLabel(61_000)).toBe('1 minuto e 1 segundo');
  });

  it('omits minutes under one minute', () => {
    expect(durationAccessibilityLabel(42_000)).toBe('42 segundos');
  });
});

describe('streakResultCopy', () => {
  it('has no hint when the streak grew', () => {
    expect(streakResultCopy(result(8, true))).toEqual({ title: 'Sequência de 8 dias', hint: null });
  });

  it('explains why the streak stayed the same', () => {
    expect(streakResultCopy(result(1, false))).toEqual({
      title: 'Sequência de 1 dia',
      hint: 'A lição de hoje já contou para a sequência.',
    });
  });
});

describe('resultAnnouncement', () => {
  it('mentions the new streak only when it grew', () => {
    expect(resultAnnouncement(result(8, true))).toBe(
      'Lição concluída. Você ganhou 50 pontos de experiência. Sua sequência aumentou para 8 dias.',
    );
    expect(resultAnnouncement(result(8, false))).toBe(
      'Lição concluída. Você ganhou 50 pontos de experiência.',
    );
  });
});
