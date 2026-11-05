import { Streak } from './Streak';

export interface UserStats {
  userId: string;
  totalXp: number;
  streak: Streak;
  // Every completion, redone lessons included.
  lessonsCompleted: number;
  // Completions without any mistake.
  perfectLessons: number;
}

export interface UserStatsRepository {
  // null for a learner who has not completed any lesson yet.
  findByUserId(userId: string): Promise<UserStats | null>;
}

export function emptyStats(userId: string): UserStats {
  return { userId, totalXp: 0, streak: Streak.empty(), lessonsCompleted: 0, perfectLessons: 0 };
}
