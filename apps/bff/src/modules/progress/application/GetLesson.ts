import type { LessonBundle } from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { LessonCatalog } from '../domain/LessonCatalog';
import type { LessonProgressRepository } from '../domain/LessonProgressRepository';
import { LessonUnlocking } from '../domain/LessonUnlocking';
import { lessonIdsOf, type TrailCatalog } from '../domain/TrailCatalog';

// userId comes from the token.
export interface GetLessonInput {
  userId: string;
  lessonId: string;
}

// The lesson's content belongs to the curriculum, but whether the learner may open it is the
// unlocking rule, which lives here with the progress it depends on.
export class GetLesson {
  constructor(
    private readonly lessons: LessonCatalog,
    private readonly trails: TrailCatalog,
    private readonly progress: LessonProgressRepository,
  ) {}

  async execute({ userId, lessonId }: GetLessonInput): Promise<Result<LessonBundle>> {
    const [lesson, trail, completed] = await Promise.all([
      this.lessons.findById(lessonId),
      this.trails.findByLessonId(lessonId),
      this.progress.findCompletedLessonIds(userId),
    ]);
    if (!lesson || !trail) {
      return err(new DomainError('LESSON_NOT_FOUND', `Lesson ${lessonId} not found`));
    }

    const status = LessonUnlocking.statusesOf(lessonIdsOf(trail), completed).get(lessonId);
    if (status === 'locked') {
      return err(new DomainError('LESSON_LOCKED', `Lesson ${lessonId} is locked`));
    }

    return ok(lesson);
  }
}
