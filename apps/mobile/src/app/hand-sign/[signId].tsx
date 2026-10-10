import { useLocalSearchParams } from 'expo-router';

import { HandSignSheet } from '@/features/alphabet';

export default function HandSignRoute() {
  const { signId } = useLocalSearchParams<{ signId: string }>();
  return <HandSignSheet signId={signId} />;
}
