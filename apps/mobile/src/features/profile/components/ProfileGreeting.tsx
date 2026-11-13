import { AppText } from '@/shared/ui';

import { greetingLabel } from '../content/greeting';
import { useProfileStore } from '../store/profileStore';

// The learner's name at the top of the home. The profile is loaded by useProfileSession.
export function ProfileGreeting() {
  const name = useProfileStore((state) => state.profile?.name ?? null);

  return (
    <AppText variant="heading" numberOfLines={1}>
      {greetingLabel(name)}
    </AppText>
  );
}
