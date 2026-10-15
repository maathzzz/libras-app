import type { StudyGuide } from '@libras/contracts';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { AppText, Button, Header } from '@/shared/ui';

import { useStudyStore } from '../store/studyStore';
import { StudyBlockView } from './StudyBlockView';
import { studySteps } from './studyView';

const gutter = spacing['2xl'];
const signGap = spacing.md;

type StudyScreenProps = {
  studyId: string;
};

export function StudyScreen({ studyId }: StudyScreenProps) {
  const status = useStudyStore((state) => state.guideStatus);
  const guide = useStudyStore((state) => state.guide);
  const openStudy = useStudyStore((state) => state.openStudy);
  const closeStudy = useStudyStore((state) => state.closeStudy);

  // Every visit starts at the first page; leaving drops the loaded study.
  useEffect(() => {
    void openStudy(studyId);
    return closeStudy;
  }, [studyId, openStudy, closeStudy]);

  if (status === 'ready' && guide) return <StudyReader guide={guide} />;

  return (
    <SafeAreaView style={styles.centered}>
      {status === 'error' ? (
        <LoadError onRetry={() => void openStudy(studyId)} />
      ) : (
        <>
          <ActivityIndicator color={colors.accent} accessibilityLabel="Preparando o estudo" />
          <AppText variant="body" color="textMuted" align="center">
            Preparando o estudo…
          </AppText>
        </>
      )}
    </SafeAreaView>
  );
}

function StudyReader({ guide }: { guide: StudyGuide }) {
  const pageIndex = useStudyStore((state) => state.pageIndex);
  const nextPage = useStudyStore((state) => state.nextPage);
  const previousPage = useStudyStore((state) => state.previousPage);
  const { width } = useWindowDimensions();
  const signWidth = (width - gutter * 2 - signGap) / 2;

  const page = guide.pages[pageIndex];
  if (!page) return null;

  const total = guide.pages.length;
  const isLast = pageIndex === total - 1;

  const onContinue = () => {
    if (nextPage() === 'finished') router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Header
        onClose={() => router.back()}
        closeLabel="Sair do estudo"
        steps={studySteps(total, pageIndex)}
      />
      {/* Keyed by page so each new page starts scrolled to the top. */}
      <ScrollView key={page.id} contentContainerStyle={styles.content}>
        <View style={styles.title}>
          <AppText variant="kicker" color="accent">
            {`${guide.title} · Página ${pageIndex + 1} de ${total}`}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {page.title}
          </AppText>
        </View>
        <View style={styles.blocks}>
          {page.blocks.map((block, index) => (
            <StudyBlockView key={index} block={block} signWidth={signWidth} />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label={isLast ? 'Concluir' : 'Continuar'} onPress={onContinue} />
        {pageIndex > 0 && <Button label="Voltar" variant="ghost" onPress={previousPage} />}
      </View>
    </SafeAreaView>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.error}>
      <AppText variant="subtitle" align="center">
        Não foi possível abrir o estudo.
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing['2xl'],
    paddingHorizontal: gutter,
    paddingBottom: spacing['5xl'],
  },
  title: {
    gap: spacing['2xs'],
  },
  blocks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: signGap,
  },
  footer: {
    gap: spacing.xs,
    paddingHorizontal: gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
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
