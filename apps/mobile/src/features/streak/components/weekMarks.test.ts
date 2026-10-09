import { weekAccessibilityLabel, weekMarks } from './weekMarks';

// 2026-10-08 is a Thursday (index 3, Monday first).
const thursday = new Date(2026, 9, 8);

const states = (days: number, today: Date) => weekMarks(days, today).map((mark) => mark.state);

describe('weekMarks', () => {
  it('starts the week on Monday', () => {
    expect(weekMarks(1, thursday).map((mark) => mark.initial)).toEqual([
      'S', 'T', 'Q', 'Q', 'S', 'S', 'D',
    ]);
  });

  it('marks today and the streak days before it', () => {
    expect(states(3, thursday)).toEqual(['none', 'done', 'done', 'today', 'none', 'none', 'none']);
  });

  it('fills the whole week up to today for a long streak', () => {
    expect(states(40, thursday)).toEqual(['done', 'done', 'done', 'today', 'none', 'none', 'none']);
  });

  it('marks only today for a streak that just started', () => {
    expect(states(1, thursday)).toEqual(['none', 'none', 'none', 'today', 'none', 'none', 'none']);
  });

  it('marks nothing without a streak', () => {
    expect(states(0, thursday)).toEqual(Array(7).fill('none'));
  });

  it('puts Sunday at the end of the week', () => {
    const sunday = new Date(2026, 9, 11);
    expect(states(2, sunday)).toEqual(['none', 'none', 'none', 'none', 'none', 'done', 'today']);
  });
});

describe('weekAccessibilityLabel', () => {
  it('names the days with a lesson', () => {
    expect(weekAccessibilityLabel(weekMarks(2, thursday))).toBe(
      'Dias com lição nesta semana: quarta, quinta',
    );
  });
});
