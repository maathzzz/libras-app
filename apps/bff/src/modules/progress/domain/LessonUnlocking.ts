import type { LessonStatus } from '@libras/contracts';

// Lessons unlock one at a time in trail order, crossing from one unit to the next. Only
// completions decide it, so content added between lessons the learner already finished
// never locks them again.
export const LessonUnlocking = {
  // `lessonIds` is the whole trail, flattened in display order.
  statusesOf(
    lessonIds: readonly string[],
    completed: ReadonlySet<string>,
  ): Map<string, LessonStatus> {
    return new Map(
      lessonIds.map((lessonId, index): [string, LessonStatus] => {
        if (completed.has(lessonId)) return [lessonId, 'completed'];

        const previous = lessonIds[index - 1];
        const unlocked = previous === undefined || completed.has(previous);
        return [lessonId, unlocked ? 'available' : 'locked'];
      }),
    );
  },
};
