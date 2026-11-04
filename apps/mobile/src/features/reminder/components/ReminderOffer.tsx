import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Button, Card } from '@/shared/ui';

import { formatReminderTime } from '../schedule/reminderTime';
import {
  markReminderOffered,
  selectReminderOn,
  shouldOfferReminder,
  useReminderStore,
} from '../store/reminderStore';

type Answer = 'none' | 'accepted' | 'declined';

// Asks before the system prompt, so a learner who is not interested never sees it and can
// still allow notifications later in the settings.
export function ReminderOffer() {
  // Decided once when the screen opens; the card stays while the learner reads it.
  const [visible] = useState(shouldOfferReminder);
  const [answer, setAnswer] = useState<Answer>('none');
  const time = useReminderStore((state) => formatReminderTime(state.time));
  const on = useReminderStore(selectReminderOn);
  const busy = useReminderStore((state) => state.busy);

  useEffect(() => {
    if (visible) markReminderOffered();
  }, [visible]);

  if (!visible || answer === 'declined') return null;

  const accept = async () => {
    await useReminderStore.getState().setEnabled(true);
    setAnswer('accepted');
    const turnedOn = selectReminderOn(useReminderStore.getState());
    AccessibilityInfo.announceForAccessibility(
      turnedOn ? `Lembrete ativado para as ${time}` : 'Lembrete não ativado',
    );
  };

  if (answer === 'accepted') {
    return (
      <Card tone={on ? 'success' : 'default'}>
        <AppText variant="subtitle">{on ? 'Lembrete ativado' : 'Lembrete não ativado'}</AppText>
        <AppText variant="body">
          {on
            ? `Se você ainda não tiver feito uma lição no dia, avisamos às ${time}. Dá para mudar o horário em Ajustes.`
            : 'Você pode ativar o lembrete quando quiser em Ajustes.'}
        </AppText>
      </Card>
    );
  }

  return (
    <Card tone="accent">
      <AppText variant="subtitle">Quer um lembrete para não perder a sequência?</AppText>
      <AppText variant="body">
        {`Se você ainda não tiver feito uma lição no dia, avisamos às ${time}.`}
      </AppText>
      <View style={styles.actions}>
        <Button
          label={busy ? 'Ativando…' : 'Ativar lembrete'}
          variant="secondary"
          onPress={() => void accept()}
          disabled={busy}
        />
        <Button label="Agora não" variant="ghost" onPress={() => setAnswer('declined')} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
