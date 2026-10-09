import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, fontSize, fontWeight } from '@/shared/theme';

type AppTextProps = {
  children: ReactNode;
  variant?: 'title' | 'body' | 'muted';
};

export function AppText({ children, variant = 'body' }: AppTextProps) {
  return <Text style={styles[variant]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: 'center',
  },
  muted: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
