import type { Exercise, ExerciseAnswer, LessonAnswer } from '@libras/contracts';

export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
}

// The switch has no default so a new exercise type fails to compile until it is graded here.
function gradeAnswer(exercise: Exercise, answer: ExerciseAnswer): boolean {
  if (answer.type !== exercise.type) return false;

  switch (exercise.type) {
    case 'sign_to_word':
    case 'word_to_sign':
      return answer.optionId === exercise.correctOptionId;
  }
}

function groupByExercise(answers: readonly LessonAnswer[]): Map<string, ExerciseAnswer[]> {
  const grouped = new Map<string, ExerciseAnswer[]>();
  for (const { exerciseId, answer } of answers) {
    grouped.set(exerciseId, [...(grouped.get(exerciseId) ?? []), answer]);
  }
  return grouped;
}

// The server's grading is the official one: the app's is only for instant feedback.
// The request is not trusted, so a missing answer and a repeated one are both wrong (the
// second would let a learner try every option), and answers to other exercises are ignored.
export const AnswerGrader = {
  grade(exercises: readonly Exercise[], answers: readonly LessonAnswer[]): ExerciseResult[] {
    const answersByExercise = groupByExercise(answers);

    return exercises.map((exercise) => {
      const given = answersByExercise.get(exercise.id) ?? [];
      const [only] = given;
      const correct = given.length === 1 && only !== undefined && gradeAnswer(exercise, only);
      return { exerciseId: exercise.id, correct };
    });
  },
};
