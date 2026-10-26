import type { CompleteLessonRequest, CompleteLessonResponse } from '@libras/contracts';

import type { Clock } from '../../../shared/application/Clock';
import { DomainError } from '../../../shared/domain/DomainError';
import { LocalDate } from '../../../shared/domain/LocalDate';
import { err, ok, type Result } from '../../../shared/domain/Result';
import { AnswerGrader } from '../domain/AnswerGrader';
import type { LessonCatalog } from '../domain/LessonCatalog';
import type { LessonSessionRepository } from '../domain/LessonSessionRepository';
import { Streak } from '../domain/Streak';
import type { UserStats, UserStatsRepository } from '../domain/UserStatsRepository';
import type { UserTimezoneProvider } from '../domain/UserTimezoneProvider';
import { XpPolicy } from '../domain/XpPolicy';

// userId comes from the token, never from the request body.
export type CompleteLessonInput = CompleteLessonRequest & { userId: string };

export class CompleteLesson {
  constructor(
    private readonly sessions: LessonSessionRepository,
    private readonly stats: UserStatsRepository,
    private readonly lessons: LessonCatalog,
    private readonly timezones: UserTimezoneProvider,
    private readonly clock: Clock,
  ) {}

  async execute(input: CompleteLessonInput): Promise<Result<CompleteLessonResponse>> {
    const { userId, lessonId, idempotencyKey, answers } = input;

    const previousSession = await this.sessions.findByIdempotencyKey(userId, idempotencyKey);
    if (previousSession) return ok(previousSession.response);

    const lesson = await this.lessons.findById(lessonId);
    if (!lesson) return err(new DomainError('LESSON_NOT_FOUND', `Lesson ${lessonId} not found`));

    const now = this.clock.now();
    const today = LocalDate.fromInstant(now, await this.timezones.timezoneOf(userId));

    const xpEarned = XpPolicy.xpFor(AnswerGrader.grade(lesson.exercises, answers));

    const stats = (await this.stats.findByUserId(userId)) ?? emptyStats(userId);
    const streak = stats.streak.registerLessonCompleted(today);

    const response: CompleteLessonResponse = {
      xpEarned,
      streak: {
        current: streak.currentAt(today),
        longest: streak.longest,
        status: streak.statusAt(today),
      },
      // Compared with the value shown before the lesson, so starting over after a broken
      // streak (0 → 1) counts as an increase, like the very first lesson.
      streakIncreased: streak.current > stats.streak.currentAt(today),
    };

    await this.sessions.saveCompletion({
      session: { userId, lessonId, idempotencyKey, completedAt: now, response },
      stats: { userId, totalXp: stats.totalXp + xpEarned, streak },
    });

    return ok(response);
  }
}

function emptyStats(userId: string): UserStats {
  return { userId, totalXp: 0, streak: Streak.empty() };
}
