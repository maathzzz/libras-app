import { optionState } from './optionState';

const correctId = 'a';

describe('optionState', () => {
  it('marks only the chosen option before checking', () => {
    const context = { chosenId: 'b', correctId, checked: false };

    expect(optionState('b', context)).toBe('selected');
    expect(optionState('a', context)).toBe('idle');
  });

  it('reveals the right option and the wrong choice after checking', () => {
    const context = { chosenId: 'b', correctId, checked: true };

    expect(optionState('a', context)).toBe('correct');
    expect(optionState('b', context)).toBe('wrong');
    expect(optionState('c', context)).toBe('idle');
  });

  it('marks a right choice as correct', () => {
    expect(optionState('a', { chosenId: 'a', correctId, checked: true })).toBe('correct');
  });
});
