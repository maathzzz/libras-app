import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { borderWidth, colors, depth, radius, raised, spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui';

type SettingsGroupProps = {
  title: string;
  children: ReactNode;
};

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  const rows = Children.toArray(children);

  return (
    <View style={styles.group}>
      <AppText variant="kicker" accessibilityRole="header">
        {title}
      </AppText>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <View style={styles.divider} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  card: {
    overflow: 'hidden',
    borderRadius: radius['2xl'],
    backgroundColor: colors.surface,
    ...raised(colors.border, depth.sm, colors.borderSubtle),
  },
  divider: {
    height: borderWidth.hairline,
    backgroundColor: colors.borderSubtle,
  },
});
