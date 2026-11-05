import type { AchievementsResponse } from '@libras/contracts';

import type { AchievementRepository } from '../domain/AchievementRepository';
import { achievementCatalog, Achievements } from '../domain/Achievements';
import type { LessonProgressRepository } from '../domain/LessonProgressRepository';
import type { TrailCatalog } from '../domain/TrailCatalog';
import { emptyStats, type UserStatsRepository } from '../domain/UserStatsRepository';

// userId comes from the token.
export interface GetAchievementsInput {
  userId: string;
}

// Only reads: achievements are unlocked by CompleteLesson. A learner whose progress already
// reaches a target that was never checked (progress made before the achievement existed)
// unlocks it with the next lesson.
export class GetAchievements {
  constructor(
    private readonly trails: TrailCatalog,
    private readonly progress: LessonProgressRepository,
    private readonly stats: UserStatsRepository,
    private readonly achievements: AchievementRepository,
  ) {}

  async execute({ userId }: GetAchievementsInput): Promise<AchievementsResponse> {
    const [trail, completed, stats, unlocked] = await Promise.all([
      this.trails.findFirst(),
      this.progress.findCompletedLessonIds(userId),
      this.stats.findByUserId(userId),
      this.achievements.findUnlocked(userId),
    ]);

    const snapshot = Achievements.snapshotOf(stats ?? emptyStats(userId), completed, trail);
    const unlockedAt = new Map(unlocked.map((entry) => [entry.achievementId, entry.unlockedAt]));

    return {
      achievements: achievementCatalog.map((definition) => {
        const date = unlockedAt.get(definition.id);
        return {
          ...Achievements.toContract(definition),
          progress: Achievements.progressOf(definition, snapshot, date !== undefined),
          unlockedAt: date?.toISOString() ?? null,
        };
      }),
    };
  }
}
