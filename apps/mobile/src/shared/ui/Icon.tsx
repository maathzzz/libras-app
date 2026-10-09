import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { colors, sizes, type ColorToken } from '@/shared/theme';

// SF Symbols on iOS, Material Symbols on Android. Add names here as screens need them.
const icons = {
  close: { ios: 'xmark', android: 'close', web: 'close' },
  streak: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  xp: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  goal: { ios: 'clock', android: 'schedule', web: 'schedule' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  locked: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
} satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  size?: keyof typeof iconSizes;
  color?: ColorToken;
};

const iconSizes = {
  sm: sizes.iconSm,
  md: sizes.iconMd,
  lg: sizes.iconLg,
  xl: sizes.iconXl,
} as const;

// Icons are decorative: the surrounding control carries the accessible label.
export function Icon({ name, size = 'md', color = 'text' }: IconProps) {
  return (
    <SymbolView
      name={icons[name]}
      size={iconSizes[size]}
      tintColor={colors[color]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
