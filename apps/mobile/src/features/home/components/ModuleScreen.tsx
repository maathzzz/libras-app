import type { HomeResponse } from '@libras/contracts';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { borderWidth, colors, spacing } from '@/shared/theme';
import { AppText, Button, IconButton, LoadError, Pill, ProgressBar } from '@/shared/ui';

import { useHomeStore } from '../store/homeStore';
import { completedLessons, lessonsLabel, percentLabel, unitProgress } from './homeView';
import { TrailPath } from './TrailPath';

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
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <IconButton
            icon="back"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            filled
          />
          <View style={styles.title}>
            <AppText variant="kicker">{`Módulo ${index + 1} de ${units.length}`}</AppText>
            <AppText variant="heading" accessibilityRole="header" numberOfLines={2}>
              {unit.title}
            </AppText>
          </View>
          <Pill label={percent} accessibilityLabel={`${percent} concluído`} />
        </View>
        <ProgressBar value={progress} size="sm" accessibilityLabel="Progresso do módulo" />
        <AppText variant="caption">
          {`${completedLessons(unit)} de ${lessonsLabel(unit.lessons.length)} concluídas`}
        </AppText>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TrailPath lessons={unit.lessons} onOpenLesson={openLesson} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing['2xs'],
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.xl,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.borderSubtle,
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
  content: {
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['5xl'],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missing: {
    gap: spacing.xl,
    paddingHorizontal: spacing['2xl'],
  },
});
