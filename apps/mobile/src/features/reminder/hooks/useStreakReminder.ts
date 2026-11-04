import { useEffect } from 'react';

import { useAuthStatus } from '@/features/auth';
import { useHome } from '@/features/home';
import { onAppForeground } from '@/shared/lib/appForeground';
import { getLocalDate } from '@/shared/lib/localDate';

import { useReminderStore } from '../store/reminderStore';

// Keeps the week of reminders scheduled while there is a session: on app opening, sign in
// and every return to the foreground. Signing out cancels them. Mounted once, in the root
// layout.
export function useStreakReminder() {
  const status = useAuthStatus();
  const streakStatus = useHome()?.streak.status;

  useEffect(() => {
    const { start, stop } = useReminderStore.getState();
    if (status === 'restoring') return;
    if (status !== 'signedIn') {
      void stop();
      return;
    }
    void start();
    return onAppForeground(() => void start());
  }, [status]);

  // A lesson done on another device (or before reinstalling) also skips today's reminder.
  useEffect(() => {
    if (streakStatus === 'done_today') {
      void useReminderStore.getState().markLessonDone(getLocalDate());
    }
  }, [streakStatus]);
}
