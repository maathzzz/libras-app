import { StudyEditor } from '@/features/studies/StudyEditor';

export default async function Page({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  return <StudyEditor studyId={decodeURIComponent(studyId)} />;
}
