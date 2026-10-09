import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { Card, Icon, type CardTone } from '@/shared/ui';

import type { OptionState } from './optionState';

type OptionCardProps = {
  children: ReactNode;
  state: OptionState;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
};

const tones: Record<OptionState, CardTone> = {
  idle: 'default',
  selected: 'accent',
  correct: 'success',
  wrong: 'danger',
};

// Screen readers hear the outcome too, not only the color change.
const outcomeLabels: Partial<Record<OptionState, string>> = {
  correct: 'resposta certa',
  wrong: 'sua resposta, errada',
};

export function OptionCard({
  children,
  state,
  accessibilityLabel,
  disabled,
  onPress,
}: OptionCardProps) {
  const outcome = outcomeLabels[state];

  return (
    <Card
      tone={tones[state]}
      selected={state === 'selected' || state === 'wrong'}
      accessibilityLabel={outcome ? `${accessibilityLabel}, ${outcome}` : accessibilityLabel}
      onPress={() => {
        if (!disabled) onPress();
      }}
    >
      {children}
      {/* The icon repeats the color so the outcome does not depend on telling green from red. */}
      {state === 'correct' && <OutcomeMark icon="check" color="successDark" />}
      {state === 'wrong' && <OutcomeMark icon="close" color="dangerDark" />}
    </Card>
  );
}

function OutcomeMark({
  icon,
  color,
}: {
  icon: 'check' | 'close';
  color: 'successDark' | 'dangerDark';
}) {
  return (
    <View style={styles.mark}>
      <Icon name={icon} size="md" color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
