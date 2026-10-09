import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { haptics } from '@/shared/lib/haptics';
import { colors, spacing } from '@/shared/theme';
import { Button, Header } from '@/shared/ui';

import { ExerciseView } from '../exercises/ExerciseView';
import { lessonGutter } from '../exercises/layout';
import { useLessonStore } from '../store/lessonStore';
import { lessonSteps } from './lessonProgress';
import { VerdictSheet } from './VerdictSheet';

// Plays the exercise at the current index through the registry; it never looks at the
// exercise type, so new types need no change here.
export function LessonPlayer() {
  const lesson = useLessonStore((state) => state.lesson);
  const currentIndex = useLessonStore((state) => state.currentIndex);
  const selection = useLessonStore((state) => state.selection);
  const verdict = useLessonStore((state) => state.verdict);
  const select = useLessonStore((state) => state.select);
  const check = useLessonStore((state) => state.check);
  const advance = useLessonStore((state) => state.advance);
  const submit = useLessonStore((state) => state.submit);

  const exercise = lesson?.exercises[currentIndex];
  if (!lesson || !exercise) return null;

  const total = lesson.exercises.length;
  const checked = verdict !== null;

  const onCheck = () => {
    const result = check();
    if (result === 'correct') void haptics.correct();
    if (result === 'wrong') void haptics.wrong();
  };

  const onContinue = () => {
    if (advance() === 'next') return;
    submit();
    router.replace('/lesson/complete');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <Header
          onClose={() => router.back()}
          closeLabel="Sair da lição"
          steps={lessonSteps(total, currentIndex, checked)}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <ExerciseView
            key={exercise.id}
            exercise={exercise}
            answer={selection}
            checked={checked}
            onAnswerChange={select}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Verificar" onPress={onCheck} disabled={!selection || checked} />
        </View>
      </SafeAreaView>
      {verdict && <VerdictSheet key={exercise.id} verdict={verdict} onContinue={onContinue} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: lessonGutter,
    paddingBottom: spacing['5xl'],
  },
  footer: {
    paddingHorizontal: lessonGutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
});
