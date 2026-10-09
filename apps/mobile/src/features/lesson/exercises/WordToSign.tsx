import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui';

import { SignSequence } from '../components/SignSequence';
import { lessonGutter } from './layout';
import { OptionCard } from './OptionCard';
import { optionState } from './optionState';
import type { ExerciseProps } from './types';

const columns = 2;
const cardPadding = spacing.xl;

// "Qual destes sinais significa BOM DIA?": a 2×2 grid of signs. The options carry no word,
// which would give the answer away; screen readers hear each sign's alt text instead.
export function WordToSign({
  exercise,
  answer,
  checked,
  onAnswerChange,
}: ExerciseProps<'word_to_sign'>) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - lessonGutter * 2 - spacing.md * (columns - 1)) / columns;
  const context = { chosenId: answer?.optionId, correctId: exercise.correctOptionId, checked };

  return (
    <View style={styles.container}>
      <View style={styles.prompt}>
        <AppText variant="kicker">Escolha o sinal</AppText>
        <AppText variant="heading" accessibilityRole="header">
          Qual destes sinais significa{' '}
          <AppText variant="heading" color="accent">
            {exercise.word.toLocaleUpperCase('pt-BR')}
          </AppText>
          ?
        </AppText>
      </View>
      <View style={styles.grid}>
        {exercise.options.map((option, index) => (
          <View key={option.id} style={{ width: cardWidth }}>
            <OptionCard
              state={optionState(option.id, context)}
              accessibilityLabel={`Opção ${index + 1}: ${option.images.map((image) => image.alt).join(', ')}`}
              disabled={checked}
              onPress={() => onAnswerChange({ type: 'word_to_sign', optionId: option.id })}
            >
              <SignSequence images={option.images} width={cardWidth - cardPadding * 2} />
            </OptionCard>
          </View>
        ))}
      </View>
      <AppText variant="caption" align="center">
        Toque em um sinal e depois em Verificar
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
