import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reloadHome } from '@/features/home';
import { colors, spacing } from '@/shared/theme';
import { AppText, Button, LoadError } from '@/shared/ui';

import { useLessonStore, type LessonLoadError } from '../store/lessonStore';
import { LessonPlayer } from './LessonPlayer';

type UnavailableReason = Extract<LessonLoadError, 'locked' | 'notFound'>;

const unavailableMessages: Record<UnavailableReason, { title: string; body: string }> = {
  locked: { title: 'Lição bloqueada', body: 'Conclua as lições anteriores para liberar esta.' },
  notFound: { title: 'Lição indisponível', body: 'Esta lição não está mais disponível.' },
};

const isUnavailable = (error: LessonLoadError | null): error is UnavailableReason =>
  error === 'locked' || error === 'notFound';

type LessonScreenProps = {
  lessonId: string;
};

export function LessonScreen({ lessonId }: LessonScreenProps) {
  const status = useLessonStore((state) => state.status);
  const loadError = useLessonStore((state) => state.loadError);
  const start = useLessonStore((state) => state.start);
  const reset = useLessonStore((state) => state.reset);

  // Every visit is a new session with a new idempotency key; leaving discards it.
  useEffect(() => {
    void start(lessonId);
    return reset;
  }, [lessonId, start, reset]);

  // Retrying would fail the same way. The home that offered this lesson was out of date, so it
  // is reloaded while the learner goes back to it.
  useEffect(() => {
    if (!isUnavailable(loadError)) return;
    const { title, body } = unavailableMessages[loadError];
    Alert.alert(title, body);
    void reloadHome();
    router.dismissTo('/');
  }, [loadError]);

  if (status === 'playing' || status === 'finished') return <LessonPlayer />;
  if (isUnavailable(loadError)) return <SafeAreaView style={styles.centered} />;

  return (
    <SafeAreaView style={styles.centered}>
      {status === 'error' && loadError ? (
        <LoadError
          title="Não foi possível abrir a lição."
          reason={loadError}
          onRetry={() => void start(lessonId)}
        >
          <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
        </LoadError>
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

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
});
