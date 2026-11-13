import { LessonExercisesPage } from '@/features/exercises/LessonExercisesPage';

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return <LessonExercisesPage lessonId={decodeURIComponent(lessonId)} />;
}
