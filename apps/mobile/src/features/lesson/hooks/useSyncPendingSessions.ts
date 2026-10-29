import { useEffect } from 'react';

import { useAuthStatus } from '@/features/auth';
import { reloadHome } from '@/features/home';
import { onAppForeground } from '@/shared/lib/appForeground';

import { pendingSessions } from '../api/pendingSessions';

async function sendPendingSessions() {
  const { sent } = await pendingSessions.flush();
  // A lesson that just reached the BFF changes the streak and XP on the home.
  if (sent > 0) await reloadHome();
}

// Sends lessons finished without network when a session starts (app opening or sign in) and
// whenever the app comes back to the foreground. Without a session the BFF would answer 401 and
// the queue would drop the lessons, so nothing is sent while signed out. Mounted once, in the
// root layout.
export function useSyncPendingSessions() {
  const signedIn = useAuthStatus() === 'signedIn';

  useEffect(() => {
    if (!signedIn) return;
    void sendPendingSessions();
    return onAppForeground(() => void sendPendingSessions());
  }, [signedIn]);
}
