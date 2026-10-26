import type { Container } from '../container';
import { CompleteLesson } from '../modules/progress/application/CompleteLesson';
import { InMemoryLessonCatalog } from '../modules/progress/testing/InMemoryLessonCatalog';
import { InMemoryProgressStore } from '../modules/progress/testing/InMemoryProgressStore';
import type { Clock } from '../shared/application/Clock';

// For tests of the HTTP layer: a Container with in-memory fakes and no database.
export function createInMemoryContainer(clock: Clock): Container {
  const store = new InMemoryProgressStore();

  return {
    clock,
    completeLesson: new CompleteLesson(
      store,
      store,
      new InMemoryLessonCatalog([]),
      clock,
    ),
  };
}
