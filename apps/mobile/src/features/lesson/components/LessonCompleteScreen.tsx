import type { CompleteLessonResponse } from '@libras/contracts';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reloadHome } from '@/features/home';
import { haptics } from '@/shared/lib/haptics';
import { colors, duration, spacing } from '@/shared/theme';
import { AppText, Button, Card, StatTile } from '@/shared/ui';

import { useCompletionStore, type LessonSummary } from '../store/completionStore';
import {
  durationAccessibilityLabel,
  failedMessage,
  formatDuration,
  pendingMessage,
  resultAnnouncement,
} from './completionView';
import { RewardBurst } from './RewardBurst';
import { StreakResultCard } from './StreakResultCard';

const enter = (step: number) => FadeInDown.delay(step * duration.stagger);

export function LessonCompleteScreen() {
  const status = useCompletionStore((state) => state.status);
  const summary = useCompletionStore((state) => state.summary);
  const result = useCompletionStore((state) => state.result);
  const reset = useCompletionStore((state) => state.reset);

  const leave = useCallback(() => {
    reset();
    void reloadHome();
    router.dismissTo('/');
  }, [reset]);

  // Android's back button leaves the same way as the button, so the home is reloaded too.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        leave();
        return true;
      });
      return () => subscription.remove();
    }, [leave]),
  );

  useEffect(() => {
    if (status === 'pending') {
      AccessibilityInfo.announceForAccessibility(`${pendingMessage.title}. ${pendingMessage.body}`);
    }
    if (status === 'failed') {
      AccessibilityInfo.announceForAccessibility(`${failedMessage.title}. ${failedMessage.body}`);
    }
  }, [status]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <RewardBurst />
        <View style={styles.headline}>
          <AppText variant="kicker" color="successDark" align="center" accessibilityRole="header">
            Lição concluída
          </AppText>
          {status === 'submitting' && <Saving />}
          {status === 'completed' && result && <EarnedXp xp={result.xpEarned} />}
        </View>
        {summary && (
          <Animated.View entering={enter(1)} style={styles.stats}>
            <SummaryTiles summary={summary} result={status === 'completed' ? result : null} />
          </Animated.View>
        )}
        {status === 'completed' && result && (
          <Animated.View entering={enter(2)}>
            <StreakResultCard result={result} />
          </Animated.View>
        )}
        {status === 'pending' && <Notice tone="warning" message={pendingMessage} />}
        {status === 'failed' && <Notice tone="danger" message={failedMessage} />}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Voltar à trilha" onPress={leave} />
      </View>
    </SafeAreaView>
  );
}

function Saving() {
  return (
    <View style={styles.saving}>
      <ActivityIndicator color={colors.accent} accessibilityLabel="Salvando sua lição" />
      <AppText variant="caption" align="center">
        Salvando sua lição…
      </AppText>
    </View>
  );
}

function EarnedXp({ xp }: { xp: number }) {
  return (
    <View accessible accessibilityLabel={`Mais ${xp} pontos de experiência`}>
      <AppText variant="display" align="center">{`+${xp}`}</AppText>
      <AppText variant="bodyStrong" color="textMuted" align="center">
        pontos de experiência
      </AppText>
    </View>
  );
}

type SummaryTilesProps = {
  summary: LessonSummary;
  result: CompleteLessonResponse | null;
};

// Correct answers and time are known locally; the streak only once the BFF answers.
function SummaryTiles({ summary, result }: SummaryTilesProps) {
  return (
    <>
      <StatTile
        tone="success"
        label="Acertos"
        value={`${summary.correct}/${summary.total}`}
        accessibilityLabel={`${summary.correct} acertos de ${summary.total}`}
      />
      <StatTile
        tone="accent"
        label="Tempo"
        value={formatDuration(summary.durationMs)}
        accessibilityLabel={`Tempo: ${durationAccessibilityLabel(summary.durationMs)}`}
      />
      {result && <StreakDaysTile result={result} />}
    </>
  );
}

// A growing streak is the reward of the day: the tile pulses, the phone vibrates and
// screen readers announce it.
function StreakDaysTile({ result }: { result: CompleteLessonResponse }) {
  const scale = useSharedValue(1);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(resultAnnouncement(result));
    if (!result.streakIncreased) return;

    void haptics.correct();
    scale.set(
      withSequence(
        withTiming(1.12, { duration: duration.pulse }),
        withTiming(1, { duration: duration.pulse }),
      ),
    );
  }, [result, scale]);

  const days = result.streak.current;
  return (
    <Animated.View style={[styles.tile, pulse]}>
      <StatTile
        tone="warning"
        label={days === 1 ? 'Dia' : 'Dias'}
        value={String(days)}
        accessibilityLabel={`Sequência de ${days} ${days === 1 ? 'dia' : 'dias'}`}
      />
    </Animated.View>
  );
}

type NoticeProps = {
  tone: 'warning' | 'danger';
  message: { title: string; body: string };
};

function Notice({ tone, message }: NoticeProps) {
  return (
    <Animated.View entering={enter(2)}>
      <Card tone={tone}>
        <AppText variant="subtitle" color={tone === 'warning' ? 'warningDark' : 'dangerDark'}>
          {message.title}
        </AppText>
        <AppText variant="body">{message.body}</AppText>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
    paddingTop: spacing['5xl'],
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing['5xl'],
  },
  headline: {
    gap: spacing.xs,
  },
  saving: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing['3xl'],
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
});
