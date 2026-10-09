import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { colors, depth, radius, raised, sizes, spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui';

import { SignSequence } from '../components/SignSequence';
import { lessonGutter } from './layout';
import { OptionCard } from './OptionCard';
import { optionState } from './optionState';
import type { ExerciseProps } from './types';

const signCardPadding = spacing['2xl'];

// The sign is shown large, in the tonal card of the "sinal novo" screen, and the
// learner picks the word from a list.
export function SignToWord({
  exercise,
  answer,
  checked,
  onAnswerChange,
}: ExerciseProps<'sign_to_word'>) {
  const { width } = useWindowDimensions();
  const signWidth = width - lessonGutter * 2 - signCardPadding * 2;
  const context = { chosenId: answer?.optionId, correctId: exercise.correctOptionId, checked };

  return (
    <View style={styles.container}>
      <View style={styles.prompt}>
        <AppText variant="kicker">Reconheça o sinal</AppText>
        <AppText variant="heading" accessibilityRole="header">
          O que este sinal significa?
        </AppText>
      </View>
      <View style={styles.signCard}>
        <SignSequence
          images={exercise.images}
          width={signWidth}
          maxFrameSize={sizes.signFrameMax}
        />
      </View>
      <View style={styles.options}>
        {exercise.options.map((option) => (
          <OptionCard
            key={option.id}
            state={optionState(option.id, context)}
            accessibilityLabel={option.label}
            disabled={checked}
            onPress={() => onAnswerChange({ type: 'sign_to_word', optionId: option.id })}
          >
            <AppText variant="subtitle">{option.label}</AppText>
          </OptionCard>
        ))}
      </View>
      <AppText variant="caption" align="center">
        Toque em uma palavra e depois em Verificar
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['2xl'],
  },
  prompt: {
    gap: spacing.xs,
  },
  signCard: {
    padding: signCardPadding,
    borderRadius: radius['4xl'],
    backgroundColor: colors.accentSoft,
    ...raised(colors.accentSoftEdge, depth.md),
  },
  options: {
    gap: spacing.md,
  },
});
