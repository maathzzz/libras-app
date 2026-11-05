export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: Date;
}

export interface AchievementRepository {
  // Empty for a learner who has not unlocked any yet. Unlocking happens in saveCompletion.
  findUnlocked(userId: string): Promise<UnlockedAchievement[]>;
}
