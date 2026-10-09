// One header segment per exercise. The current one fills once it is checked, so the bar
// moves forward with every exercise.
export function lessonSteps(total: number, currentIndex: number, checked: boolean): number[] {
  return Array.from({ length: total }, (_, index) =>
    index < currentIndex || (index === currentIndex && checked) ? 1 : 0,
  );
}
