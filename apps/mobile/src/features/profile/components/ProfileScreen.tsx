import type { HomeResponse } from '@libras/contracts';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/features/auth';
import {
  completedUnits,
  daysLabel,
  formatXp,
  reloadHome,
  trailLessonCounts,
  useHome,
} from '@/features/home';
import { haptics } from '@/shared/lib/haptics';
import { colors, spacing } from '@/shared/theme';
import { AppText, Button, Card, ProgressBar, ScreenTitle } from '@/shared/ui';

import { startLevelLabels } from '../content/startLevels';
import { useProfileStore } from '../store/profileStore';
import { IdentityCard } from './IdentityCard';
import { ProfileStat } from './ProfileStat';

function confirmSignOut() {
  Alert.alert('Sair da conta?', 'Você vai precisar entrar de novo para continuar.', [
    { text: 'Cancelar', style: 'cancel' },
    // The session guard in the root layout takes the learner back to the welcome screen.
    { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
  ]);
}

// Shown while the home, where these numbers come from, has not loaded yet.
const missingValue = '—';

function Stats({ home }: { home: HomeResponse | null }) {
  const lessons = home ? trailLessonCounts(home.trail) : null;

  return (
    <View style={styles.stats}>
      <View style={styles.statsRow}>
        <ProfileStat
          label="XP total"
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

function TrailProgress({ home }: { home: HomeResponse }) {
  const { trail } = home;
  const lessons = trailLessonCounts(trail);

  return (
    <Card>
      <View style={styles.progressHeader}>
        <AppText variant="bodyStrong">Progresso na trilha</AppText>
        <AppText variant="caption">
          {`${completedUnits(trail)} de ${trail.units.length} módulos`}
        </AppText>
      </View>
      <ProgressBar
        value={lessons.completed / lessons.total}
        size="sm"
        accessibilityLabel={`Progresso na trilha ${trail.title}`}
      />
      <AppText variant="caption">
        {lessons.completed === 0
          ? 'Nenhuma lição concluída ainda.'
          : `${lessons.completed} de ${lessons.total} lições de ${trail.title} concluídas.`}
      </AppText>
    </Card>
  );
}

export function ProfileScreen() {
  const profile = useProfileStore((state) => state.profile);
  const home = useHome();
  const homeMissing = home === null;
  const deleting = useProfileStore((state) => state.deleting);
  const load = useProfileStore((state) => state.load);
  const deleteAccount = useProfileStore((state) => state.deleteAccount);
  const [deleteFailed, setDeleteFailed] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  // The stats come from the home; it is normally loaded already by the first tab.
  useEffect(() => {
    if (homeMissing) void reloadHome();
  }, [homeMissing]);

  const removeAccount = async () => {
    setDeleteFailed(false);
    if (await deleteAccount()) return;
    setDeleteFailed(true);
    void haptics.wrong();
  };

  // Spells out that nothing can be recovered: deleting is the only action here that cannot be undone.
  const confirmDelete = () => {
    Alert.alert(
      'Excluir sua conta para sempre?',
      'Sua conta, sua sequência, seu XP e todo o seu progresso serão apagados. Não será possível desfazer nem recuperar nada depois.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir para sempre',
          style: 'destructive',
          onPress: () => void removeAccount(),
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle title="Perfil" />
        {profile && (
          <IdentityCard name={profile.name} level={startLevelLabels[profile.startLevel]} />
        )}

        <View style={styles.section}>
          <AppText variant="kicker" accessibilityRole="header">
            Estatísticas
          </AppText>
          <Stats home={home} />
          {home && <TrailProgress home={home} />}
        </View>

        <Button label="Sair da conta" variant="secondary" onPress={confirmSignOut} />

        <View style={styles.deleteSection}>
          <AppText variant="caption">
            Excluir a conta apaga todos os seus dados de forma permanente.
          </AppText>
          <Button
            label={deleting ? 'Excluindo…' : 'Excluir conta'}
            variant="danger"
            onPress={confirmDelete}
            disabled={deleting}
          />
          {deleteFailed && (
            <View accessibilityRole="alert" accessibilityLiveRegion="polite">
              <AppText variant="bodyStrong" color="danger" align="center">
                Não foi possível excluir a conta. Verifique sua conexão e tente de novo.
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing['4xl'],
    paddingTop: spacing['3xs'],
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['5xl'],
  },
  section: {
    gap: spacing.lg,
  },
  stats: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  deleteSection: {
    gap: spacing.md,
  },
});
