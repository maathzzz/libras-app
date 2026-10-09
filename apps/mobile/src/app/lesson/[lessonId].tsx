import { useLocalSearchParams } from 'expo-router';

import { LessonScreen } from '@/features/lesson';

export default function LessonRoute() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  return <LessonScreen lessonId={lessonId} />;
}
