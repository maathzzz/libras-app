import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/features/auth';
import { haptics } from '@/shared/lib/haptics';
import { colors, spacing } from '@/shared/theme';
import { AppText, Button, Card, ScreenTitle } from '@/shared/ui';

import { useProfileStore } from '../store/profileStore';

function confirmSignOut() {
  Alert.alert('Sair da conta?', 'Você vai precisar entrar de novo para continuar.', [
    { text: 'Cancelar', style: 'cancel' },
    // The session guard in the root layout takes the learner back to the welcome screen.
    { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
  ]);
}

export function ProfileScreen() {
  const profile = useProfileStore((state) => state.profile);
  const deleting = useProfileStore((state) => state.deleting);
  const load = useProfileStore((state) => state.load);
  const deleteAccount = useProfileStore((state) => state.deleteAccount);
  const [deleteFailed, setDeleteFailed] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

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
          <Card>
            <View style={styles.name}>
              <AppText variant="kicker">Nome de exibição</AppText>
              <AppText variant="heading">{profile.name}</AppText>
            </View>
          </Card>
        )}

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
  name: {
    gap: spacing.xs,
  },
  deleteSection: {
    gap: spacing.md,
  },
});
