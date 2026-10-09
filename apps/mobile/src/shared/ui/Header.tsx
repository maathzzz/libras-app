import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';

import { IconButton } from './IconButton';
import { ProgressBar } from './ProgressBar';

type HeaderProps = {
  onClose?: () => void;
  closeLabel?: string;
  /** One entry per lesson step, each between 0 and 1. */
  steps?: readonly number[];
  trailing?: ReactNode;
};

// Top bar of focused flows (lesson, exercises): close, step progress and a trailing badge.
export function Header({ onClose, closeLabel = 'Fechar', steps, trailing }: HeaderProps) {
  return (
    <View style={styles.header}>
      {onClose && <IconButton icon="close" accessibilityLabel={closeLabel} onPress={onClose} />}
      <View style={styles.center}>
        {steps?.map((value, index) => (
          <View key={index} style={styles.step}>
            <ProgressBar
              value={value}
              size="sm"
              accessibilityLabel={`Etapa ${index + 1} de ${steps.length}`}
            />
          </View>
        ))}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  step: {
    flex: 1,
  },
});
