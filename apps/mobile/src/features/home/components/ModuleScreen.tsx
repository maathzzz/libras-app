import type { HomeResponse } from '@libras/contracts';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { AppText, Button, GameHeader, IconButton, LoadError, Pill } from '@/shared/ui';

import { useHomeStore } from '../store/homeStore';
import { completedLessons, lessonsLabel, percentLabel, unitProgress } from './homeView';
import { LessonSegments } from './LessonSegments';
import { TrailMap } from './TrailMap';

type ModuleScreenProps = {
  unitId: string;
};

function openLesson(lessonId: string) {
  router.push({ pathname: '/lesson/[lessonId]', params: { lessonId } });
}

// Reads the module from the home already loaded: finishing a lesson reloads the home, so this
// screen follows the progress without a request of its own.
export function ModuleScreen({ unitId }: ModuleScreenProps) {
  const status = useHomeStore((state) => state.status);
  const home = useHomeStore((state) => state.home);
  const errorReason = useHomeStore((state) => state.errorReason);
  const load = useHomeStore((state) => state.load);

  useEffect(() => {
    if (!useHomeStore.getState().home) void load();
  }, [load]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {home ? (
        <ModuleContent home={home} unitId={unitId} />
      ) : status === 'error' && errorReason ? (
        <View style={styles.centered}>
          <LoadError
            title="Não foi possível carregar o módulo."
            reason={errorReason}
            onRetry={() => void load()}
          />
        </View>
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando o módulo" />
        </View>
      )}
    </SafeAreaView>
  );
}

type ModuleContentProps = {
  home: HomeResponse;
  unitId: string;
};

function ModuleContent({ home, unitId }: ModuleContentProps) {
  const { units } = home.trail;
  const index = units.findIndex((unit) => unit.id === unitId);
  const unit = units[index];

  if (!unit) {
    return (
      <View style={[styles.centered, styles.missing]}>
        <AppText variant="bodyStrong" align="center">
          Este módulo não está mais disponível.
        </AppText>
        <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const progress = unitProgress(unit);
  const percent = percentLabel(progress);

  return (
    <>
      <GameHeader>
        <View style={styles.titleRow}>
          <IconButton
            icon="back"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            look="raised"
          />
          <View style={styles.title}>
            <AppText variant="kicker" color="textMuted">
              {`Módulo ${index + 1} de ${units.length}`}
            </AppText>
            <AppText variant="headingStrong" accessibilityRole="header" numberOfLines={2}>
              {unit.title}
            </AppText>
          </View>
          {/* The pill sizes to its text; the wrapper centers it on the title row. */}
          <View>
            <Pill label={percent} accessibilityLabel={`${percent} concluído`} />
          </View>
        </View>
        <View style={styles.segments}>
          <LessonSegments lessons={unit.lessons} progress={progress} />
        </View>
        <View style={styles.legend}>
          <AppText variant="caption">
            {`${completedLessons(unit)} de ${lessonsLabel(unit.lessons.length)} concluídas`}
          </AppText>
        </View>
      </GameHeader>
      <TrailMap lessons={unit.lessons} onOpenLesson={openLesson} />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  missing: {
    gap: spacing.xl,
    paddingHorizontal: spacing['2xl'],
  },
});
