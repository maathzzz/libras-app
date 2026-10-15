import { useLocalSearchParams } from 'expo-router';

import { StudyScreen } from '@/features/study';

export default function StudyRoute() {
  const { studyId } = useLocalSearchParams<{ studyId: string }>();
  return <StudyScreen studyId={studyId} />;
}
