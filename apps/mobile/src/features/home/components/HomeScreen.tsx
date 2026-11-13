import type { HomeResponse } from '@libras/contracts';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { AppText, GameHeader, LoadError } from '@/shared/ui';

import { useHomeStore } from '../store/homeStore';
import { HomeStats } from './HomeStats';
import { findNextLesson, hasStartedTrail, unitsLegend } from './homeView';
import { ModuleRoad } from './ModuleRoad';
import { NextLessonCard } from './NextLessonCard';
import { StreakCard } from './StreakCard';
import { TrailSegments } from './TrailSegments';

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

// The lessons of a module only show up on its own screen.
function openModule(unitId: string) {
  router.push({ pathname: '/module/[unitId]', params: { unitId } });
}

// Same header as the module map, with the trail's progress, over the plain app background.
function HomeContent({ home, refreshing, onRefresh }: HomeContentProps) {
  const { trail } = home;
  const next = findNextLesson(trail);

  return (
    <>
      <GameHeader>
        <View style={styles.titleRow}>
          <View style={styles.title}>
            <AppText variant="kicker" color="textMuted">
              {`Trilha ${trail.position} de ${trail.totalTrails}`}
            </AppText>
            <AppText variant="headingStrong" accessibilityRole="header" numberOfLines={2}>
              {trail.title}
            </AppText>
          </View>
          <HomeStats streak={home.streak} totalXp={home.totalXp} />
        </View>
        <View style={styles.segments}>
          <TrailSegments trail={trail} />
        </View>
        <View style={styles.legend}>
          <AppText variant="caption">{unitsLegend(trail)}</AppText>
        </View>
      </GameHeader>
      <View style={styles.world}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
        >
          {next && (
            <NextLessonCard
              next={next}
              isFirstLesson={!hasStartedTrail(trail)}
              onStart={() => openLesson(next.lesson.id)}
            />
          )}
          <StreakCard streak={home.streak} />
          <ModuleRoad trail={trail} onOpenModule={openModule} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  title: {
    flex: 1,
    gap: spacing['3xs'],
  },
  segments: {
    marginTop: spacing.lg,
  },
  legend: {
    marginTop: spacing.xs,
  },
  world: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing['4xl'],
    paddingTop: spacing['5xl'],
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['6xl'],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
