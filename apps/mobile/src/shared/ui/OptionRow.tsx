import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

type OptionRowProps = {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  /** What goes in the box at the left: an icon or a short text, like a number. */
  leading: { icon: IconName } | { text: string };
  tag?: string;
};

// A single choice in a list, like the level or the daily goal in the onboarding.
export function OptionRow({
  title,
  description,
  selected,
  onPress,
  leading,
  tag,
}: OptionRowProps) {
  const foreground = selected ? 'onColor' : 'textSubtle';

  return (
    <Card
      tone={selected ? 'accent' : 'default'}
      onPress={onPress}
      selected={selected}
      accessibilityLabel={`${title}. ${description}`}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.leading,
            { backgroundColor: selected ? colors.accent : colors.borderSubtle },
          ]}
        >
          {'icon' in leading ? (
            <Icon name={leading.icon} size="lg" color={foreground} />
          ) : (
            <AppText variant="subtitle" color={foreground}>
              {leading.text}
            </AppText>
          )}
        </View>
        <View style={styles.text}>
          <AppText variant="subtitle" color={selected ? 'accent' : 'text'}>
            {title}
          </AppText>
          <AppText variant="caption">{description}</AppText>
          {tag && (
            <View
              style={[
                styles.tag,
                { backgroundColor: selected ? colors.surface : colors.surfaceSubtle },
              ]}
            >
              <AppText variant="label" color={selected ? 'accent' : 'textSubtle'}>
                {tag}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  leading: {
    width: sizes.optionLeading,
    height: sizes.optionLeading,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
    gap: spacing['3xs'],
  },
  tag: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingVertical: spacing['2xs'],
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
});
