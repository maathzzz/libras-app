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
  trail: { ios: 'map', android: 'route', web: 'route' },
  alphabet: { ios: 'textformat.abc', android: 'abc', web: 'abc' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  hand: { ios: 'hand.raised.fill', android: 'back_hand', web: 'back_hand' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  chart: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  person: { ios: 'person', android: 'person', web: 'person' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  password: { ios: 'lock', android: 'lock', web: 'lock' },
  show: { ios: 'eye', android: 'visibility', web: 'visibility' },
  hide: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
  study: { ios: 'book.fill', android: 'menu_book', web: 'menu_book' },
  tip: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  trophy: { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  review: { ios: 'arrow.counterclockwise', android: 'replay', web: 'replay' },
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
