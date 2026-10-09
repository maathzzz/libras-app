import type { ExerciseType } from '@libras/contracts';
import type { ComponentType } from 'react';

import { SignToWord } from './SignToWord';
import type { ExerciseProps } from './types';
import { WordToSign } from './WordToSign';

// One component per exercise type. Mapped instead of a plain Record so each component
// receives its own narrowed exercise; a missing type is a compile error.
export const exerciseComponents: { [T in ExerciseType]: ComponentType<ExerciseProps<T>> } = {
  sign_to_word: SignToWord,
  word_to_sign: WordToSign,
};
