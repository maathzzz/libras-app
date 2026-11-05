import { useEffect } from 'react';

import { clearAchievements } from '@/features/achievements';
import { useAuthStatus } from '@/features/auth';

import { useProfileStore } from '../store/profileStore';

// Loads the profile (GET /v1/me) as soon as there is a session and forgets it, with the
// achievements shown on the profile, when the session ends, however it ends, so a device
// never shows the previous learner. Mounted once, in the
// root layout.
export function useProfileSession() {
  const signedIn = useAuthStatus() === 'signedIn';

  useEffect(() => {
    if (signedIn) {
      void useProfileStore.getState().load();
      return;
    }
    useProfileStore.getState().clear();
    clearAchievements();
  }, [signedIn]);
}
