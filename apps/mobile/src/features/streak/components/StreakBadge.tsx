import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/theme';

export function StreakBadge() {
  return (
    <View style={styles.badge} accessibilityLabel="Sequência de 0 dias">
      <Text style={styles.label}>Sequência: 0 dias</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.streak,
  },
});
