import type {
  Achievement,
  AchievementCategory,
  AchievementProgress,
  AchievementStatus,
} from '@libras/contracts';

import type { ColorToken } from '@/shared/theme';
import type { IconName } from '@/shared/ui';

type CategoryLook = { icon: IconName; background: ColorToken; color: ColorToken };

// The badge of an unlocked achievement; a locked one is drawn gray with the same icon.
export const categoryLooks: Record<AchievementCategory, CategoryLook> = {
  lessons: { icon: 'hand', background: 'successSoft', color: 'successDark' },
  perfect: { icon: 'star', background: 'infoSoft', color: 'infoDark' },
  review: { icon: 'review', background: 'accentSoft', color: 'accent' },
  xp: { icon: 'xp', background: 'accentSoft', color: 'accent' },
  streak: { icon: 'streak', background: 'warningSoft', color: 'warning' },
  modules: { icon: 'trail', background: 'successSoft', color: 'successDark' },
};

const numberFormat = new Intl.NumberFormat('pt-BR');

export function isUnlocked(achievement: AchievementStatus): boolean {
  return achievement.unlockedAt !== null;
}

export function unlockedCount(achievements: readonly AchievementStatus[]): number {
  return achievements.filter(isUnlocked).length;
}

// "45/100", with the thousands separator of pt-BR ("120/1.000").
export function progressLabel({ current, target }: AchievementProgress): string {
  return `${numberFormat.format(current)}/${numberFormat.format(target)}`;
}

// "20/10/2026", in the device's zone.
export function formatUnlockDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

// One sentence per badge for screen readers.
export function achievementAccessibilityLabel(achievement: AchievementStatus): string {
  const { title, description, progress, unlockedAt } = achievement;
  if (unlockedAt !== null) {
    return `${title}. ${description} Conquistada em ${formatUnlockDate(unlockedAt)}.`;
  }
  return `${title}, bloqueada. ${description} Progresso: ${progress.current} de ${progress.target}.`;
}

export function unlockedTitle(achievements: readonly Achievement[]): string {
  return achievements.length === 1 ? 'Conquista desbloqueada!' : 'Conquistas desbloqueadas!';
}
