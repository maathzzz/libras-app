import type {
  CompleteLessonResponse,
  ProfileResponse,
  StreakStatus,
  StreakSummary,
  UpdateProfileRequest,
} from '@libras/contracts';

// Development fixtures: an in-memory stand-in for the BFF's user_stats and profile, so the
// home, the lesson completion and the settings show the same data without the BFF running.
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

let stats = initialStats(initialStreakStatus);
let profile = initialProfile;
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
  };
  stats = { streak, totalXp: stats.totalXp + xpEarned };
  processed.set(idempotencyKey, response);
  return response;
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
  processed = new Map();
}
