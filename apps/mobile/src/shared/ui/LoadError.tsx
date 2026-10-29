import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Button } from './Button';

export type LoadErrorReason = 'offline' | 'server';

// Without connection the learner can act on it; a server failure only needs a later retry.
const hints: Record<LoadErrorReason, string> = {
  offline: 'Você está sem internet. Verifique sua conexão e tente de novo.',
  server: 'Tivemos um problema do nosso lado. Tente de novo em alguns instantes.',
};

type LoadErrorProps = {
  title: string;
  reason: LoadErrorReason;
  onRetry: () => void;
  /** Extra actions below "Tentar de novo", such as going back. */
  children?: ReactNode;
};

export function LoadError({ title, reason, onRetry, children }: LoadErrorProps) {
  return (
    <View style={styles.root}>
      <AppText variant="subtitle" align="center" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="body" align="center">
        {hints[reason]}
      </AppText>
      <Button label="Tentar de novo" onPress={onRetry} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    gap: spacing.lg,
    paddingHorizontal: spacing['4xl'],
  },
});
