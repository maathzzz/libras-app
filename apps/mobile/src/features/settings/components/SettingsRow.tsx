import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui';

type SettingsRowProps = {
  title: string;
  description?: string;
  /** Control shown at the right of the title, like a switch. */
  trailing?: ReactNode;
  /** Control shown under the title, like a row of options. */
  children?: ReactNode;
};

export function SettingsRow({ title, description, trailing, children }: SettingsRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <View style={styles.text}>
          <AppText variant="bodyStrong">{title}</AppText>
          {description && <AppText variant="caption">{description}</AppText>}
        </View>
        {trailing}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  text: {
    flex: 1,
  },
});
