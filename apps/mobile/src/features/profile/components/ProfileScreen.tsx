import type { HomeResponse } from '@libras/contracts';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AchievementsSection } from '@/features/achievements';
import {
  daysLabel,
  formatXp,
  reloadHome,
  trailLessonCounts,
  TrailSegments,
  unitsLegend,
  useHome,
} from '@/features/home';
import { colors, spacing } from '@/shared/theme';
import { AppText, Card, GameHeader, IconButton, MapLabel, Pill } from '@/shared/ui';

import { startLevelLabels } from '../content/startLevels';
import { useProfileStore } from '../store/profileStore';
import { IdentityCard } from './IdentityCard';
import { ProfileStat } from './ProfileStat';

// Shown while the home, where these numbers come from, has not loaded yet.
const missingValue = '—';

function Stats({ home }: { home: HomeResponse | null }) {
  const lessons = home ? trailLessonCounts(home.trail) : null;

  return (
    <View style={styles.stats}>
      <View style={styles.statsRow}>
        <ProfileStat
          label="Pontos"
          value={home ? formatXp(home.totalXp) : missingValue}
          icon="xp"
          tone="accent"
        />
        <ProfileStat
          label="Sequência atual"
          value={home ? daysLabel(home.streak.current) : missingValue}
          icon="streak"
          tone="warning"
        />
      </View>
      <View style={styles.statsRow}>
        <ProfileStat
          label="Maior sequência"
          value={home ? daysLabel(home.streak.longest) : missingValue}
          icon="trophy"
          tone="warning"
        />
        {/* The BFF only sends the current trail, so earlier trails are not counted. */}
        <ProfileStat
          label="Lições feitas"
          value={lessons ? String(lessons.completed) : missingValue}
          icon="check"
          tone="success"
        />
      </View>
    </View>
  );
}

// The trail's bar of the home, one part per module.
function TrailProgress({ home }: { home: HomeResponse }) {
  const { trail } = home;
  const lessons = trailLessonCounts(trail);
  const percent = `${Math.round((lessons.completed / lessons.total) * 100)}%`;

  return (
    <Card>
      <View style={styles.progressHeader}>
        <View style={styles.progressTitle}>
          <AppText variant="statLabel" color="textMuted">
            {`Trilha atual · ${unitsLegend(trail)}`}
          </AppText>
          <AppText variant="subtitle" numberOfLines={2}>
            {trail.title}
          </AppText>
        </View>
        <Pill label={percent} accessibilityLabel={`${percent} da trilha concluído`} />
      </View>
      <TrailSegments trail={trail} />
      <AppText variant="caption">
        {lessons.completed === 0
          ? 'Nenhuma lição concluída ainda.'
          : `${lessons.completed} de ${lessons.total} lições concluídas.`}
      </AppText>
    </Card>
  );
}

export function ProfileScreen() {
  const profile = useProfileStore((state) => state.profile);
  const home = useHome();
  const homeMissing = home === null;
  const load = useProfileStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  // The stats come from the home; it is normally loaded already by the first tab.
  useEffect(() => {
    if (homeMissing) void reloadHome();
  }, [homeMissing]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <GameHeader>
        <View style={styles.titleRow}>
          <AppText variant="headingStrong" accessibilityRole="header">
            Perfil
          </AppText>
          <IconButton
            icon="settings"
            accessibilityLabel="Ajustes"
            size="lg"
            look="raised"
            onPress={() => router.push('/settings')}
          />
        </View>
      </GameHeader>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {profile && (
          <IdentityCard name={profile.name} level={startLevelLabels[profile.startLevel]} />
        )}

        <View style={styles.section}>
          <MapLabel text="Estatísticas" header />
          <Stats home={home} />
          {home && <TrailProgress home={home} />}
        </View>

        <AchievementsSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing['5xl'],
    paddingTop: spacing['4xl'],
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['6xl'],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    gap: spacing.lg,
  },
  stats: {
    gap: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  progressTitle: {
    flex: 1,
    gap: spacing['3xs'],
  },
});
