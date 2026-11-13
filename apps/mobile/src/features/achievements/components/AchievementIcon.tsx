import type { AchievementCategory } from '@libras/contracts';

import { Medal, type MedalSize } from '@/shared/ui';

import { categoryLooks } from './achievementView';

type AchievementIconProps = {
  category: AchievementCategory;
  locked?: boolean;
  size?: MedalSize;
};

// The category's medal, in the style of the module map's nodes: colored once unlocked, gray
// like a locked lesson until then. Decorative: the row around it carries the accessible label.
export function AchievementIcon({ category, locked = false, size = 'md' }: AchievementIconProps) {
  const look = categoryLooks[category];
  return <Medal icon={look.icon} tone={locked ? 'locked' : look.tone} size={size} />;
}
