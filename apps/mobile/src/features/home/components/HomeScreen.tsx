import type { HomeResponse } from '@libras/contracts';
import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { AppText, GameHeader, LoadError } from '@/shared/ui';

import { useHomeStore } from '../store/homeStore';
import { HomeStats } from './HomeStats';
import { findNextLesson, hasStartedTrail } from './homeView';
import { ModuleRoad } from './ModuleRoad';
import { NextLessonCard } from './NextLessonCard';
import { StreakCard } from './StreakCard';

type HomeScreenProps = {
  /** "Olá, nome", at the left of the streak and XP. */
  greeting: ReactNode;
};

export function HomeScreen({ greeting }: HomeScreenProps) {
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
        <HomeContent home={home} greeting={greeting} refreshing={refreshing} onRefresh={refresh} />
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
  greeting: ReactNode;
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

// The greeting with the streak and XP stay fixed at the top; the trail's title and the
// lesson to do now open the content below.
function HomeContent({ home, greeting, refreshing, onRefresh }: HomeContentProps) {
  const { trail } = home;
  const next = findNextLesson(trail);

  return (
    <>
      <GameHeader>
        <View style={styles.headerRow}>
          <View style={styles.greeting}>{greeting}</View>
          <HomeStats streak={home.streak} totalXp={home.totalXp} />
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
          <View style={styles.intro}>
            <View style={styles.title}>
              <AppText variant="kicker" color="textSubtle">
                {`Trilha ${trail.position} de ${trail.totalTrails}`}
              </AppText>
              <AppText variant="title" accessibilityRole="header" numberOfLines={2}>
                {trail.title}
              </AppText>
            </View>
            {next && (
              <NextLessonCard
                next={next}
                isFirstLesson={!hasStartedTrail(trail)}
                onStart={() => openLesson(next.lesson.id)}
              />
            )}
          </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  greeting: {
    flex: 1,
  },
  intro: {
    gap: spacing['2xl'],
  },
  title: {
    gap: spacing['2xs'],
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
