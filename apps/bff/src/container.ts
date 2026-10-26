import { DrizzleLessonRepository } from './modules/curriculum/infrastructure/DrizzleLessonRepository';
import { CompleteLesson } from './modules/progress/application/CompleteLesson';
import { DrizzleProgressStore } from './modules/progress/infrastructure/DrizzleProgressStore';
import type { Clock } from './shared/application/Clock';
import { SystemClock } from './shared/application/SystemClock';
import type { DbExecutor } from './shared/infrastructure/db/client';

// Composition root: the one place that picks concrete implementations and wires them by
// constructor. Unit tests build their own objects with in-memory fakes.
export interface Container {
  clock: Clock;
  completeLesson: CompleteLesson;
}

export function createContainer(db: DbExecutor): Container {
  const clock = new SystemClock();
  const progress = new DrizzleProgressStore(db);

  return {
    clock,
    completeLesson: new CompleteLesson(
      progress,
      progress,
      // The curriculum repository matches the progress port by shape.
      new DrizzleLessonRepository(db),
      clock,
    ),
  };
}
