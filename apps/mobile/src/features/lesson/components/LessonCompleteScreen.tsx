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
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UnlockedAchievementsCard } from '@/features/achievements';
import { ReminderOffer } from '@/features/reminder';
import { haptics } from '@/shared/lib/haptics';
import { colors, depth, duration, radius, spacing, trailColors } from '@/shared/theme';
import { AppText, Button, Card, Countryside, GameFooter, MapLabel, StatTile } from '@/shared/ui';

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

  // The home is reloaded by the completion store once the BFF answers, even after leaving.
  const leave = useCallback(() => {
    reset();
    router.dismissTo('/');
  }, [reset]);

  // Android's back button leaves the same way as the button.
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
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.world}>
        <Countryside id="lesson-complete-sky" />
        <ScrollView contentContainerStyle={styles.content}>
          <RewardBurst />
          <View style={styles.headline}>
            <MapLabel text="Lição concluída" color="successText" header centered />
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
          {status === 'completed' && result && result.achievementsUnlocked.length > 0 && (
            <Animated.View entering={enter(3)}>
              <UnlockedAchievementsCard achievements={result.achievementsUnlocked} />
            </Animated.View>
          )}
          {status === 'pending' && <Notice tone="warning" message={pendingMessage} />}
          {status === 'failed' && <Notice tone="danger" message={failedMessage} />}
          {status !== 'failed' && (
            <Animated.View entering={enter(4)}>
              <ReminderOffer />
            </Animated.View>
          )}
        </ScrollView>
      </View>
      <SafeAreaView edges={['bottom']} style={styles.footerArea}>
        <GameFooter>
          <Button label="Voltar à trilha" onPress={leave} />
        </GameFooter>
      </SafeAreaView>
    </SafeAreaView>
  );
}

function Saving() {
  return (
    <View style={[styles.balloon, styles.saving]}>
      <ActivityIndicator color={colors.accent} accessibilityLabel="Salvando sua lição" />
      <AppText variant="caption" align="center">
        Salvando sua lição…
      </AppText>
    </View>
  );
}

// The XP floats in a white balloon, like the module map's "Começar". The float stops when
// the system asks for reduced motion.
function EarnedXp({ xp }: { xp: number }) {
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    lift.set(
      withRepeat(
        withTiming(-depth.lg, {
          duration: duration.balloonFloat,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
  }, [lift, reduceMotion]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.get() }] }));

  return (
    <Animated.View
      accessible
      accessibilityLabel={`Mais ${xp} pontos de experiência`}
      style={[styles.balloon, floatStyle]}
    >
      <AppText variant="display" color="accent" align="center">{`+${xp}`}</AppText>
      <AppText variant="callout" color="accentDark" align="center">
        pontos de experiência
      </AppText>
    </Animated.View>
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
        icon="check"
        label="Acertos"
        value={`${summary.correct}/${summary.total}`}
        accessibilityLabel={`${summary.correct} acertos de ${summary.total}`}
      />
      <StatTile
        tone="accent"
        icon="goal"
        label="Tempo"
        value={formatDuration(summary.durationMs)}
        accessibilityLabel={`Tempo: ${durationAccessibilityLabel(summary.durationMs)}`}
      />
      {result && <StreakDaysTile result={result} />}
    </>
  );
}

// A growing streak is the reward of the day: the tile pulses, the phone vibrates and
// screen readers announce it. A new achievement also vibrates, once for both.
function StreakDaysTile({ result }: { result: CompleteLessonResponse }) {
  const scale = useSharedValue(1);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(resultAnnouncement(result));
    if (result.streakIncreased || result.achievementsUnlocked.length > 0) void haptics.correct();
    if (!result.streakIncreased) return;

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
        icon="streak"
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
  // The top inset shows the sky of the countryside below it.
  root: {
    flex: 1,
    backgroundColor: trailColors.skyTop,
  },
  world: {
    flex: 1,
  },
  content: {
    gap: spacing['2xl'],
    paddingTop: spacing['5xl'],
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing['5xl'],
  },
  headline: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  balloon: {
    alignSelf: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing['6xl'],
    borderRadius: radius['3xl'],
    backgroundColor: colors.surface,
    boxShadow: [
      { offsetX: 0, offsetY: depth.sm, blurRadius: 0, color: colors.accentSoftEdge },
      {
        offsetX: 0,
        offsetY: spacing.sm,
        blurRadius: spacing['3xl'],
        color: trailColors.balloonShadow,
      },
    ],
  },
  saving: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
  },
  footerArea: {
    backgroundColor: colors.surface,
  },
});
