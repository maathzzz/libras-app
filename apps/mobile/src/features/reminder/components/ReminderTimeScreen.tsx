import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { Button, ScreenTitle } from '@/shared/ui';

import type { ReminderTime } from '../schedule/reminderTime';
import { useReminderStore } from '../store/reminderStore';

// The picker works with a full date; only its hour and minute matter here.
const toDate = ({ hour, minute }: ReminderTime) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

// Opened from the settings.
export function ReminderTimeScreen() {
  const current = useReminderStore((state) => state.time);
  const setTime = useReminderStore((state) => state.setTime);
  const [time, setLocalTime] = useState<ReminderTime>(current);

  const save = () => {
    void setTime(time);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle
          title="Horário do lembrete"
          description="Se você ainda não tiver feito uma lição no dia, avisamos neste horário."
        />
        <DateTimePicker
          mode="time"
          // The wheel on iOS and the clock on Android, both inside the screen.
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          presentation="inline"
          is24Hour
          locale="pt_BR"
          accentColor={colors.accent}
          value={toDate(time)}
          onValueChange={(_, date) =>
            setLocalTime({ hour: date.getHours(), minute: date.getMinutes() })
          }
        />
      </ScrollView>
      <View style={styles.actions}>
        <Button label="Salvar" onPress={save} />
        <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing['3xl'],
    paddingTop: spacing.sm,
    paddingHorizontal: spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
});
