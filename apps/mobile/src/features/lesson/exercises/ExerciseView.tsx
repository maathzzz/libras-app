import type { ComponentType } from 'react';

import { exerciseComponents } from './registry';
import type { ExerciseProps } from './types';

// Renders any exercise without knowing its type. TypeScript cannot relate
// `exercise.type` to the component it selects, but the registry's mapped type
// guarantees each type's component receives that type's exercise.
export function ExerciseView(props: ExerciseProps) {
  const Exercise = exerciseComponents[props.exercise.type] as ComponentType<ExerciseProps>;
  return <Exercise {...props} />;
}
