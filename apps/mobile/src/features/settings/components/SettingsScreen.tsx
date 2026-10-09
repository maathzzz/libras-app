import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/features/auth';
import { useHomeStreakDays, useHomeTotalXp } from '@/features/home';
import { dailyGoalLabel, loadProfile, useProfile } from '@/features/profile';
import { colors, radius, spacing } from '@/shared/theme';
import { AppText, Button, ScreenTitle, Switch } from '@/shared/ui';

import { useSettingsStore } from '../store/settingsStore';
import { PillButton } from './PillButton';
import { ProfileCard } from './ProfileCard';
import { SettingsGroup } from './SettingsGroup';
import { SettingsRow } from './SettingsRow';
import { SpeedSelector } from './SpeedSelector';

const appVersion = Constants.expoConfig?.version;

function confirmSignOut() {
  Alert.alert('Sair da conta?', 'Você vai precisar entrar de novo para continuar.', [
    { text: 'Cancelar', style: 'cancel' },
    // The session guard in the root layout takes the learner back to the welcome screen.
    { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
  ]);
}

export function SettingsScreen() {
  const profile = useProfile();
  const totalXp = useHomeTotalXp();
  const streakDays = useHomeStreakDays();
  const reminderOn = useSettingsStore((state) => state.reminderOn);
  const reminderDenied = useSettingsStore((state) => state.reminderDenied);
  const reminderBusy = useSettingsStore((state) => state.reminderBusy);
  const setReminder = useSettingsStore((state) => state.setReminder);

  // The design keeps these on screen, but the MVP has no sound, video or sketches to apply them to.
  const [soundOn, setSoundOn] = useState(true);
  const [highContrastOn, setHighContrastOn] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle title="Ajustes" />
        {profile && (
          <ProfileCard
            name={profile.name}
            totalXp={totalXp}
            streakDays={streakDays}
            onEdit={() => router.push('/profile')}
          />
        )}

        <SettingsGroup title="Hábito de estudo">
          <SettingsRow
            title="Lembrete diário"
            description={
              reminderDenied
                ? 'Permita notificações nos ajustes do aparelho.'
                : 'Todos os dias às 20:00'
            }
            trailing={
              <Switch
                value={reminderOn}
                onValueChange={setReminder}
                disabled={reminderBusy}
                accessibilityLabel="Lembrete diário às 20:00"
              />
            }
          />
          {profile && (
            <SettingsRow
              title="Meta diária"
              description={dailyGoalLabel(profile.dailyGoal)}
              trailing={
                <PillButton
                  label="Alterar"
                  tone="neutral"
                  accessibilityLabel="Alterar meta diária"
                  onPress={() => router.push('/daily-goal')}
                />
              }
            />
          )}
        </SettingsGroup>

        <SettingsGroup title="Lições">
          <SettingsRow
            title="Som nos exercícios"
            description="Retorno sonoro de acerto e erro"
            trailing={
              <Switch
                value={soundOn}
                onValueChange={setSoundOn}
                accessibilityLabel="Som nos exercícios"
              />
            }
          />
          <SettingsRow title="Velocidade do vídeo do sinal">
            <SpeedSelector />
          </SettingsRow>
          <SettingsRow
            title="Alto contraste nos esboços"
            description="Traço mais escuro nas mãos"
            trailing={
              <Switch
                value={highContrastOn}
                onValueChange={setHighContrastOn}
                accessibilityLabel="Alto contraste nos esboços"
              />
            }
          />
        </SettingsGroup>

        <View style={styles.credits}>
          <AppText variant="caption">
            Sinais do Dicionário da Língua Brasileira de Sinais — INES.
            {appVersion ? ` Versão ${appVersion}.` : ''}
          </AppText>
        </View>
        <Button label="Sair da conta" variant="danger" onPress={confirmSignOut} />
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
  credits: {
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceSubtle,
  },
});
