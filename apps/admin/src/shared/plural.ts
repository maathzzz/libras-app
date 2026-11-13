// "1 lição", "3 lições".
export const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

// Where a sign is used: "2 exercícios e 1 estudo"; null when nowhere.
export function signUsage({
  exerciseCount,
  studyCount,
}: {
  exerciseCount: number;
  studyCount: number;
}): string | null {
  const parts = [
    exerciseCount > 0 ? plural(exerciseCount, 'exercício', 'exercícios') : null,
    studyCount > 0 ? plural(studyCount, 'estudo', 'estudos') : null,
  ].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(' e ') : null;
}
