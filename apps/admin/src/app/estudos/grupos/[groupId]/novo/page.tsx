import { StudyEditor } from '@/features/studies/StudyEditor';

export default async function Page({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <StudyEditor groupId={decodeURIComponent(groupId)} />;
}
