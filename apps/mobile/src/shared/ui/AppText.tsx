import type { ReactNode } from 'react';
import { StyleSheet, Text, type AccessibilityRole, type TextStyle } from 'react-native';

import { colors, textStyles, type ColorToken, type TextVariant } from '@/shared/theme';

type AppTextProps = {
  children: ReactNode;
  variant?: TextVariant;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
  accessibilityRole?: AccessibilityRole;
};

export function AppText({
  children,
  variant = 'body',
  color,
  align,
  numberOfLines,
  accessibilityRole,
}: AppTextProps) {
  return (
    <Text
      accessibilityRole={accessibilityRole}
      numberOfLines={numberOfLines}
      style={[styles[variant], color && { color: colors[color] }, align && { textAlign: align }]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create(textStyles);
