import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/features/auth';
import { useHomeStreakDays, useHomeTotalXp } from '@/features/home';
import { DeleteAccountLink, dailyGoalLabel, loadProfile, useProfile } from '@/features/profile';
import {
  setReminderEnabled,
  useReminderBlocked,
  useReminderBusy,
  useReminderOn,
  useReminderTime,
} from '@/features/reminder';
import { colors, radius, spacing } from '@/shared/theme';
import { AppText, Button, ScreenTitle, Switch, TextLink } from '@/shared/ui';

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

function reminderDescription(on: boolean, blocked: boolean, time: string) {
  if (on) return `Às ${time}, se você ainda não fez uma lição no dia`;
  if (blocked) return 'As notificações estão bloqueadas. Permita nos ajustes do aparelho.';
  return 'Um aviso nos dias em que você ainda não praticou';
}

export function SettingsScreen() {
  const profile = useProfile();
  const totalXp = useHomeTotalXp();
  const streakDays = useHomeStreakDays();
  const reminderOn = useReminderOn();
  const reminderBlocked = useReminderBlocked();
  const reminderBusy = useReminderBusy();
  const reminderTime = useReminderTime();

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
            title="Lembrete de sequência"
            description={reminderDescription(reminderOn, reminderBlocked, reminderTime)}
            trailing={
              <Switch
                value={reminderOn}
                onValueChange={(on) => void setReminderEnabled(on)}
                disabled={reminderBusy}
                accessibilityLabel="Lembrete de sequência"
              />
            }
          >
            {reminderBlocked && !reminderOn && (
              <TextLink
                label="Abrir ajustes do aparelho"
                onPress={() => void Linking.openSettings()}
              />
            )}
          </SettingsRow>
          {reminderOn && (
            <SettingsRow
              title="Horário do lembrete"
              description={reminderTime}
              trailing={
                <PillButton
                  label="Alterar"
                  tone="neutral"
                  accessibilityLabel={`Alterar horário do lembrete, agora às ${reminderTime}`}
                  onPress={() => router.push('/reminder-time')}
                />
              }
            />
          )}
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
        <DeleteAccountLink />
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
