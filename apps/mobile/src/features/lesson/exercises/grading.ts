import type { Exercise, ExerciseAnswer } from '@libras/contracts';

// Only for instant feedback: the BFF re-grades every answer and its result is the official one.
// The switch has no default so a new exercise type fails to compile until it is graded here.
export function gradeAnswer(exercise: Exercise, answer: ExerciseAnswer): boolean {
  if (answer.type !== exercise.type) return false;

  switch (exercise.type) {
    case 'sign_to_word':
    case 'word_to_sign':
      return answer.optionId === exercise.correctOptionId;
  }
}
