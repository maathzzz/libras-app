import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';

import { AppText } from './AppText';

type ScreenTitleProps = {
  title: string;
  kicker?: string;
  description?: string;
};

export function ScreenTitle({ title, kicker, description }: ScreenTitleProps) {
  return (
    <View style={styles.container}>
      {kicker && <AppText variant="kicker">{kicker}</AppText>}
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {description && (
        <AppText variant="body" color="textMuted">
          {description}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['2xs'],
  },
});
