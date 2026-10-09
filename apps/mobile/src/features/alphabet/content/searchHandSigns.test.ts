import { letters, numbers } from './handSigns';
import { searchHandSigns } from './searchHandSigns';

const labels = (query: string) => {
  const results = searchHandSigns(query);
  return {
    letters: results.letters.map((sign) => sign.label),
    numbers: results.numbers.map((sign) => sign.label),
  };
};

describe('searchHandSigns', () => {
  it('lists every letter and number without a query', () => {
    expect(searchHandSigns('   ')).toEqual({ letters, numbers });
  });

  it('spells a word in order, keeping repeated letters', () => {
    expect(labels('casa').letters).toEqual(['C', 'A', 'S', 'A']);
  });

  it('ignores accents and spaces', () => {
    expect(labels('Ação já').letters).toEqual(['A', 'C', 'A', 'O', 'J', 'A']);
  });

  it('matches numbers as whole values', () => {
    expect(labels('10 e 3')).toEqual({ letters: ['E'], numbers: ['10', '3'] });
  });

  it('finds nothing for numbers outside 0 to 10', () => {
    expect(labels('42')).toEqual({ letters: [], numbers: [] });
  });
});
