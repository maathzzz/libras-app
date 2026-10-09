import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

import { useLessonStore } from '../store/lessonStore';
import { LessonPlayer } from './LessonPlayer';

type LessonScreenProps = {
  lessonId: string;
};

export function LessonScreen({ lessonId }: LessonScreenProps) {
  const status = useLessonStore((state) => state.status);
  const start = useLessonStore((state) => state.start);
  const reset = useLessonStore((state) => state.reset);

  // Every visit is a new session with a new idempotency key; leaving discards it.
  useEffect(() => {
    void start(lessonId);
    return reset;
  }, [lessonId, start, reset]);

  if (status === 'playing' || status === 'finished') return <LessonPlayer />;

  return (
    <SafeAreaView style={styles.centered}>
      {status === 'error' ? (
        <LoadError onRetry={() => void start(lessonId)} />
      ) : (
        <>
          <ActivityIndicator color={colors.accent} accessibilityLabel="Preparando a lição" />
          <AppText variant="body" color="textMuted" align="center">
            Preparando a lição…
          </AppText>
        </>
      )}
    </SafeAreaView>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.error}>
      <AppText variant="subtitle" align="center">
        Não foi possível abrir a lição.
      </AppText>
      <AppText variant="body" align="center">
        Verifique sua conexão e tente de novo.
      </AppText>
      <Button label="Tentar de novo" onPress={onRetry} />
      <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  error: {
    alignSelf: 'stretch',
    gap: spacing.lg,
    paddingHorizontal: spacing['4xl'],
  },
});
