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
import { XpPolicy } from '../domain/XpPolicy';

// userId comes from the token, never from the request body.
export type CompleteLessonInput = CompleteLessonRequest & { userId: string };

export class CompleteLesson {
  constructor(
    private readonly sessions: LessonSessionRepository,
    private readonly stats: UserStatsRepository,
    private readonly lessons: LessonCatalog,
    private readonly clock: Clock,
  ) {}

  async execute(input: CompleteLessonInput): Promise<Result<CompleteLessonResponse>> {
    const { userId, lessonId, idempotencyKey, answers, localDate } = input;

    const previousSession = await this.sessions.findByIdempotencyKey(userId, idempotencyKey);
    if (previousSession) return ok(previousSession.response);

    // The day is the device's date when the lesson ended. Past dates are accepted, since
    // the offline queue sends lessons late; a future one is only possible within a day of
    // UTC (UTC+14 is the furthest zone ahead), so anything beyond is a wrong device clock.
    const now = this.clock.now();
    const day = LocalDate.parse(localDate);
    if (day.minusDays(1).isAfter(LocalDate.utcDateOf(now))) {
      return err(
        new DomainError('LOCAL_DATE_TOO_FAR_AHEAD', `Local date ${localDate} is too far ahead`),
      );
    }

    const lesson = await this.lessons.findById(lessonId);
    if (!lesson) return err(new DomainError('LESSON_NOT_FOUND', `Lesson ${lessonId} not found`));

    const xpEarned = XpPolicy.xpFor(AnswerGrader.grade(lesson.exercises, answers));

    const stats = (await this.stats.findByUserId(userId)) ?? emptyStats(userId);
    const streak = stats.streak.registerLessonCompleted(day);

    const response: CompleteLessonResponse = {
      xpEarned,
      streak: {
        current: streak.currentAt(day),
        longest: streak.longest,
        status: streak.statusAt(day),
      },
      // Compared with the value shown before the lesson, so starting over after a broken
      // streak (0 → 1) counts as an increase, like the very first lesson.
      streakIncreased: streak.current > stats.streak.currentAt(day),
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
