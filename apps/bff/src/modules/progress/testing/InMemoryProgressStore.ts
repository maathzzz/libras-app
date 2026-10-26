import type {
  LessonCompletion,
  LessonSession,
  LessonSessionRepository,
} from '../domain/LessonSessionRepository';
import type { UserStats, UserStatsRepository } from '../domain/UserStatsRepository';

// For tests: one object behind both repositories, so saveCompletion updates sessions and
// stats together, as the real transaction does.
export class InMemoryProgressStore implements LessonSessionRepository, UserStatsRepository {
  private readonly savedSessions: LessonSession[] = [];
  private readonly statsByUser = new Map<string, UserStats>();

  get sessions(): readonly LessonSession[] {
    return this.savedSessions;
  }

  seedStats(stats: UserStats): void {
    this.statsByUser.set(stats.userId, stats);
  }

  async findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<LessonSession | null> {
    return (
      this.savedSessions.find(
        (session) => session.userId === userId && session.idempotencyKey === idempotencyKey,
      ) ?? null
    );
  }

  async findByUserId(userId: string): Promise<UserStats | null> {
    return this.statsByUser.get(userId) ?? null;
  }

  async saveCompletion({ session, stats }: LessonCompletion): Promise<void> {
    this.savedSessions.push(session);
    this.statsByUser.set(stats.userId, stats);
  }
}
