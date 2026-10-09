import type { Exercise, SignImage } from '@libras/contracts';

// Every image an exercise can show, so the whole lesson is prefetched before it starts.
// The switch has no default so a new exercise type fails to compile until it is listed here.
export function exerciseImages(exercise: Exercise): SignImage[] {
  switch (exercise.type) {
    case 'sign_to_word':
      return exercise.images;
    case 'word_to_sign':
      return exercise.options.flatMap((option) => option.images);
  }
}
