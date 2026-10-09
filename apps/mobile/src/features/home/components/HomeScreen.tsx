import type { HomeResponse } from '@libras/contracts';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { AppText, Button, ScreenTitle } from '@/shared/ui';

import { useHomeStore } from '../store/homeStore';
import { DailyGoalCard } from './DailyGoalCard';
import { HomeStats } from './HomeStats';
import { hasStartedTrail } from './homeCopy';
import { NextLessonCard } from './NextLessonCard';
import { TrailPath } from './TrailPath';

export function HomeScreen() {
  const status = useHomeStore((state) => state.status);
  const home = useHomeStore((state) => state.home);
  const refreshing = useHomeStore((state) => state.refreshing);
  const load = useHomeStore((state) => state.load);
  const refresh = useHomeStore((state) => state.refresh);

  // Reloads on every focus so streak and XP are fresh when coming back from a lesson.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {home ? (
        <HomeContent home={home} refreshing={refreshing} onRefresh={refresh} />
      ) : status === 'error' ? (
        <LoadError onRetry={load} />
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

function HomeContent({ home, refreshing, onRefresh }: HomeContentProps) {
  const { trail, nextLesson } = home;
  const hasStarted = hasStartedTrail(trail);

  const startLesson = nextLesson
    ? () =>
        router.push({
          pathname: '/lesson/[lessonId]',
          params: { lessonId: nextLesson.lessonId },
        })
    : undefined;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <HomeStats streak={home.streak} totalXp={home.totalXp} dailyGoal={home.dailyGoal} />
      <ScreenTitle
        kicker={`Trilha ${trail.position} de ${trail.totalTrails}`}
        title={trail.title}
      />
      {nextLesson && startLesson && (
        <NextLessonCard lesson={nextLesson} isFirstLesson={!hasStarted} onStart={startLesson} />
      )}
      <DailyGoalCard
        goal={home.dailyGoal}
        streakStatus={home.streak.status}
        hasStarted={hasStarted}
      />
      <TrailPath units={trail.units} onStartLesson={startLesson} />
    </ScrollView>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={[styles.centered, styles.error]}>
      <AppText variant="subtitle" align="center">
        Não foi possível carregar sua trilha.
      </AppText>
      <AppText variant="body" align="center">
        Verifique sua conexão e tente de novo.
      </AppText>
      <Button label="Tentar de novo" onPress={onRetry} />
    </View>
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
  error: {
    gap: spacing.lg,
    paddingHorizontal: spacing['4xl'],
  },
});
