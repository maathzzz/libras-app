import { useLocalSearchParams } from 'expo-router';

import { ModuleScreen } from '@/features/home';

export default function ModuleRoute() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  return <ModuleScreen unitId={unitId} />;
}
