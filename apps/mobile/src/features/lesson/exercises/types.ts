import type { Exercise, ExerciseAnswer, ExerciseType } from '@libras/contracts';

export type ExerciseOf<T extends ExerciseType> = Extract<Exercise, { type: T }>;
export type AnswerOf<T extends ExerciseType> = Extract<ExerciseAnswer, { type: T }>;

export type ExerciseProps<T extends ExerciseType = ExerciseType> = {
  exercise: ExerciseOf<T>;
  /** The learner's current choice, before and after it is checked. */
  answer: AnswerOf<T> | null;
  /** After checking, the exercise shows what was right and wrong and stops taking input. */
  checked: boolean;
  onAnswerChange: (answer: AnswerOf<T>) => void;
};
