import type { CompleteLessonResponse } from '@libras/contracts';

import type { UserStats } from './UserStatsRepository';

// The whole response is kept so a retry with the same Idempotency-Key gets back exactly
// what the first request returned, even after the streak or the day has changed.
export interface LessonSession {
  userId: string;
  lessonId: string;
  idempotencyKey: string;
  completedAt: Date;
  response: CompleteLessonResponse;
}

export interface LessonCompletion {
  session: LessonSession;
  stats: UserStats;
  // Unlocked at the session's completedAt.
  unlockedAchievementIds: string[];
}

export interface LessonSessionRepository {
  // The key is scoped to the user: two learners may generate the same one.
  findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<LessonSession | null>;

  // Writes the session, the lesson progress, the user stats and the unlocked achievements in
  // one transaction. The storage must have a unique (user_id, idempotency_key) so two
  // concurrent retries cannot both grant XP.
  saveCompletion(completion: LessonCompletion): Promise<void>;
}
