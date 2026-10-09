import { useEffect } from 'react';

import { reloadHome } from '@/features/home';
import { onAppForeground } from '@/shared/lib/appForeground';

import { pendingSessions } from '../api/pendingSessions';

async function sendPendingSessions() {
  const { sent } = await pendingSessions.flush();
  // A lesson that just reached the BFF changes the streak and XP on the home.
  if (sent > 0) await reloadHome();
}

// Sends lessons finished without network when the app opens and whenever it comes back
// to the foreground. Mounted once, in the root layout.
export function useSyncPendingSessions() {
  useEffect(() => {
    void sendPendingSessions();
    return onAppForeground(() => void sendPendingSessions());
  }, []);
}
