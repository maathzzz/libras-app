import type { HomeResponse } from '@libras/contracts';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { LoadError, ScreenTitle } from '@/shared/ui';

import { useHomeStore } from '../store/homeStore';
import { HomeStats } from './HomeStats';
import { findNextLesson, hasStartedTrail } from './homeView';
import { NextLessonCard } from './NextLessonCard';
import { StreakCard } from './StreakCard';
import { TrailPath } from './TrailPath';

export function HomeScreen() {
  const status = useHomeStore((state) => state.status);
  const home = useHomeStore((state) => state.home);
  const errorReason = useHomeStore((state) => state.errorReason);
  const refreshing = useHomeStore((state) => state.refreshing);
  const load = useHomeStore((state) => state.load);
  const refresh = useHomeStore((state) => state.refresh);

  // Later reloads are explicit (reloadHome): after a lesson is sent, streak and XP change.
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {home ? (
        <HomeContent home={home} refreshing={refreshing} onRefresh={refresh} />
      ) : status === 'error' && errorReason ? (
        <View style={styles.centered}>
          <LoadError
            title="Não foi possível carregar sua trilha."
            reason={errorReason}
            onRetry={() => void load()}
          />
        </View>
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando sua trilha" />
        </View>
      )}
    </SafeAreaView>
  );
}

type HomeContentProps = {
  home: HomeResponse;
  refreshing: boolean;
  onRefresh: () => void;
};

function openLesson(lessonId: string) {
  router.push({ pathname: '/lesson/[lessonId]', params: { lessonId } });
}

function HomeContent({ home, refreshing, onRefresh }: HomeContentProps) {
  const { trail } = home;
  const next = findNextLesson(trail);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <HomeStats streak={home.streak} totalXp={home.totalXp} />
      <ScreenTitle
        kicker={`Trilha ${trail.position} de ${trail.totalTrails}`}
        title={trail.title}
      />
      {next && (
        <NextLessonCard
          next={next}
          isFirstLesson={!hasStartedTrail(trail)}
          onStart={() => openLesson(next.lesson.id)}
        />
      )}
      <StreakCard streak={home.streak} />
      <TrailPath units={trail.units} onOpenLesson={openLesson} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing['3xl'],
    paddingTop: spacing['3xs'],
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['5xl'],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
