import type { Streak } from './Streak';

export interface UserStats {
  userId: string;
  totalXp: number;
  streak: Streak;
}

export interface UserStatsRepository {
  // null for a learner who has not completed any lesson yet.
  findByUserId(userId: string): Promise<UserStats | null>;
}
