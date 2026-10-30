import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { haptics } from '@/shared/lib/haptics';
import { spacing } from '@/shared/theme';
import { AppText, TextLink } from '@/shared/ui';

import { useProfileStore } from '../store/profileStore';

// Kept discreet at the bottom of the settings: it is the only action that cannot be undone.
export function DeleteAccountLink() {
  const deleting = useProfileStore((state) => state.deleting);
  const deleteAccount = useProfileStore((state) => state.deleteAccount);
  const [failed, setFailed] = useState(false);

  const removeAccount = async () => {
    setFailed(false);
    if (await deleteAccount()) return;
    setFailed(true);
    void haptics.wrong();
  };

  // Spells out that nothing can be recovered.
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
    <View style={styles.container}>
      <TextLink
        label={deleting ? 'Excluindo…' : 'Excluir conta'}
        onPress={confirmDelete}
        disabled={deleting}
        accessibilityHint="Apaga sua conta e todo o seu progresso para sempre"
      />
      {failed && (
        <View accessibilityRole="alert" accessibilityLiveRegion="polite">
          <AppText variant="caption" color="danger" align="center">
            Não foi possível excluir a conta. Verifique sua conexão e tente de novo.
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['2xs'],
  },
});
