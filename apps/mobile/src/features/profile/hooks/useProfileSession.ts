import { useEffect } from 'react';

import { useAuthStatus } from '@/features/auth';

import { useProfileStore } from '../store/profileStore';

// Loads the profile (GET /v1/me) as soon as there is a session and forgets it when the session
// ends, however it ends, so a device never shows the previous learner. Mounted once, in the
// root layout.
export function useProfileSession() {
  const signedIn = useAuthStatus() === 'signedIn';

  useEffect(() => {
    if (signedIn) void useProfileStore.getState().load();
    else useProfileStore.getState().clear();
  }, [signedIn]);
}
