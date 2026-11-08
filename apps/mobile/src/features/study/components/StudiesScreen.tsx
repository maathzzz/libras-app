import type { StudyGroup, StudySummary } from '@libras/contracts';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Button, Card, Icon, ScreenTitle } from '@/shared/ui';

import { useStudyStore } from '../store/studyStore';
import { pagesLabel } from './studyView';

export function StudiesScreen() {
  const status = useStudyStore((state) => state.listStatus);
  const groups = useStudyStore((state) => state.groups);
  const loadStudies = useStudyStore((state) => state.loadStudies);

  useEffect(() => {
    void loadStudies();
  }, [loadStudies]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {status === 'ready' ? (
        <StudyList groups={groups} />
      ) : status === 'error' ? (
        <LoadError onRetry={loadStudies} />
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando os estudos" />
        </View>
      )}
    </SafeAreaView>
  );
}

function openStudy(studyId: string) {
  router.push({ pathname: '/study/[studyId]', params: { studyId } });
}

function StudyList({ groups }: { groups: readonly StudyGroup[] }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenTitle title="Estudar" description="Leia o conteúdo no seu ritmo, antes ou depois de praticar." />
      {groups.length === 0 && (
        <AppText variant="body" color="textMuted" align="center">
          Ainda não há conteúdo para estudar.
        </AppText>
      )}
      {groups.map((group) => (
        <View key={group.id} style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            {group.title}
          </AppText>
          <View style={styles.cards}>
            {group.studies.map((study) => (
              <StudyCard key={study.id} study={study} onPress={() => openStudy(study.id)} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function StudyCard({ study, onPress }: { study: StudySummary; onPress: () => void }) {
  const pages = pagesLabel(study.pageCount);

  return (
    <Card onPress={onPress} accessibilityLabel={`${study.title}. ${study.description} ${pages}.`}>
      <View style={styles.row}>
        <View style={styles.leading}>
          <Icon name="study" size="lg" color="accent" />
        </View>
        <View style={styles.text}>
          <AppText variant="subtitle">{study.title}</AppText>
          <AppText variant="caption">{study.description}</AppText>
          <AppText variant="label" color="accent">
            {pages}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={[styles.centered, styles.error]}>
      <AppText variant="subtitle" align="center">
        Não foi possível carregar os estudos.
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
  section: {
    gap: spacing['3xs'],
  },
  cards: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  leading: {
    width: sizes.optionLeading,
    height: sizes.optionLeading,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  text: {
    flex: 1,
    gap: spacing['3xs'],
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
