import type { AchievementCategory } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { colors, sizes } from '@/shared/theme';
import { Icon } from '@/shared/ui';

import { categoryLooks } from './achievementView';

type AchievementIconProps = {
  category: AchievementCategory;
  locked?: boolean;
};

// Round badge with the category's icon, gray while locked. Decorative: the row around it
// carries the accessible label.
export function AchievementIcon({ category, locked = false }: AchievementIconProps) {
  const look = categoryLooks[category];

  return (
    <View
      style={[
        styles.circle,
        { backgroundColor: locked ? colors.lockedSurface : colors[look.background] },
      ]}
    >
      <Icon name={look.icon} size="lg" color={locked ? 'locked' : look.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: sizes.achievementBadge,
    height: sizes.achievementBadge,
    borderRadius: sizes.achievementBadge / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
