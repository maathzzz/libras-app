export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong';

type OptionContext = {
  chosenId: string | undefined;
  correctId: string;
  checked: boolean;
};

// After checking, the right option is always revealed, even when the learner missed it.
export function optionState(
  optionId: string,
  { chosenId, correctId, checked }: OptionContext,
): OptionState {
  const chosen = optionId === chosenId;
  if (!checked) return chosen ? 'selected' : 'idle';
  if (optionId === correctId) return 'correct';
  return chosen ? 'wrong' : 'idle';
}
