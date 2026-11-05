import type {
  Achievement,
  AchievementStatus,
  CompleteLessonResponse,
  ProfileResponse,
  StreakStatus,
  StreakSummary,
  UpdateProfileRequest,
} from '@libras/contracts';

// Development fixtures: an in-memory stand-in for the BFF's user_stats, achievements and
// profile, so the home, the lesson completion, the profile and the settings show the same data
// without the BFF running.
// Only the functions in features/*/api look at `mocksEnabled`; screens and stores never know.
export const mocksEnabled = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

// Long enough for loading states to be visible on the device.
export function mockLatency(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// To check another case on the device, change the starting status: 'at_risk' grows to 8,
// 'broken' restarts at 1 and 'done_today' completes a lesson without increasing the streak.
const initialStreakStatus: StreakStatus = 'at_risk';

const initialStreaks: Record<StreakStatus, StreakSummary> = {
  at_risk: { current: 7, longest: 12, status: 'at_risk' },
  done_today: { current: 8, longest: 12, status: 'done_today' },
  broken: { current: 0, longest: 12, status: 'broken' },
};

const initialTotalXp = 1240;

const initialProfile: ProfileResponse = {
  name: 'Matheus Amorim',
  dailyGoal: 3,
  startLevel: 'beginner',
};

type MockStats = {
  streak: StreakSummary;
  totalXp: number;
};

function initialStats(status: StreakStatus): MockStats {
  return {
    streak: initialStreaks[status],
    totalXp: initialTotalXp,
  };
}

// A sample of the BFF's catalog, consistent with the stats above (1240 XP, longest streak
// of 12). "Mãos incansáveis" is one lesson away, so the next lesson shows an unlock.
const unlockedAt = '2026-10-20T15:00:00.000Z';
const initialAchievements: AchievementStatus[] = [
  {
    id: 'first-lesson',
    title: 'Primeiro sinal',
    description: 'Conclua sua primeira lição.',
    category: 'lessons',
    progress: { current: 1, target: 1 },
    unlockedAt,
  },
  {
    id: 'lessons-30',
    title: 'Mãos incansáveis',
    description: 'Conclua 30 lições.',
    category: 'lessons',
    progress: { current: 29, target: 30 },
    unlockedAt: null,
  },
  {
    id: 'perfect-10',
    title: 'Olhar afiado',
    description: 'Conclua 10 lições sem nenhum erro.',
    category: 'perfect',
    progress: { current: 6, target: 10 },
    unlockedAt: null,
  },
  {
    id: 'first-review',
    title: 'Revisão',
    description: 'Refaça uma lição que você já concluiu.',
    category: 'review',
    progress: { current: 1, target: 1 },
    unlockedAt,
  },
  {
    id: 'xp-1000',
    title: 'Mil pontos',
    description: 'Alcance 1.000 XP.',
    category: 'xp',
    progress: { current: 1000, target: 1000 },
    unlockedAt,
  },
  {
    id: 'streak-7',
    title: 'Uma semana de Libras',
    description: 'Mantenha uma sequência de 7 dias.',
    category: 'streak',
    progress: { current: 7, target: 7 },
    unlockedAt,
  },
  {
    id: 'streak-30',
    title: 'Hábito formado',
    description: 'Mantenha uma sequência de 30 dias.',
    category: 'streak',
    progress: { current: 12, target: 30 },
    unlockedAt: null,
  },
  {
    id: 'modules-3',
    title: 'Meio caminho',
    description: 'Conclua 3 módulos.',
    category: 'modules',
    progress: { current: 1, target: 3 },
    unlockedAt: null,
  },
];

let stats = initialStats(initialStreakStatus);
let profile = initialProfile;
let achievements = initialAchievements;
let processed = new Map<string, CompleteLessonResponse>();

export function getMockStats(): MockStats {
  return stats;
}

// Same rule as the BFF: same day keeps the streak, the day after adds one, otherwise it
// restarts at 1. The mock has no calendar, so `at_risk` stands for "last lesson yesterday".
function nextStreak(streak: StreakSummary): StreakSummary {
  if (streak.status === 'done_today') return streak;

  const current = streak.status === 'at_risk' ? streak.current + 1 : 1;
  return { current, longest: Math.max(streak.longest, current), status: 'done_today' };
}

export function recordMockCompletion(
  idempotencyKey: string,
  xpEarned: number,
): CompleteLessonResponse {
  const previous = processed.get(idempotencyKey);
  if (previous) return previous;

  const streak = nextStreak(stats.streak);
  const response = {
    xpEarned,
    streak,
    streakIncreased: streak.current !== stats.streak.current,
    achievementsUnlocked: advanceMockAchievements(xpEarned),
  };
  stats = { streak, totalXp: stats.totalXp + xpEarned };
  processed.set(idempotencyKey, response);
  return response;
}

// Only the lesson counts move in the mock: one more lesson, and one more perfect lesson
// when it earned the bonus. Returns the achievements that reached their target.
function advanceMockAchievements(xpEarned: number): Achievement[] {
  const perfect = xpEarned > 10;
  const unlocked: Achievement[] = [];

  achievements = achievements.map((achievement) => {
    const grows =
      achievement.category === 'lessons' || (perfect && achievement.category === 'perfect');
    if (achievement.unlockedAt !== null || !grows) return achievement;

    const { target } = achievement.progress;
    const current = Math.min(achievement.progress.current + 1, target);
    const { id, title, description, category } = achievement;
    if (current === target) unlocked.push({ id, title, description, category });
    return {
      ...achievement,
      progress: { current, target },
      unlockedAt: current === target ? new Date().toISOString() : null,
    };
  });

  return unlocked;
}

export function getMockAchievements(): AchievementStatus[] {
  return achievements;
}

export function getMockProfile(): ProfileResponse {
  return profile;
}

export function updateMockProfile(update: UpdateProfileRequest): ProfileResponse {
  profile = {
    name: update.name ?? profile.name,
    dailyGoal: update.dailyGoal ?? profile.dailyGoal,
    startLevel: update.startLevel ?? profile.startLevel,
  };
  return profile;
}

export function resetMockServer(status: StreakStatus = initialStreakStatus): void {
  stats = initialStats(status);
  profile = initialProfile;
  achievements = initialAchievements;
  processed = new Map();
}
