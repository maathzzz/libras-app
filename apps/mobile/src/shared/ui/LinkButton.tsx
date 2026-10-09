import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, fontWeight, minTouchTarget, radius, spacing } from '@/shared/theme';

type LinkButtonProps = {
  href: Href;
  label: string;
  replace?: boolean;
};

export function LinkButton({ href, label, replace = false }: LinkButtonProps) {
  return (
    <Link href={href} replace={replace} asChild>
      <Pressable accessibilityRole="button" style={styles.button}>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.onPrimary,
  },
});
