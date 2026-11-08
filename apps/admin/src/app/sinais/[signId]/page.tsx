import { SignEditor } from '@/features/signs/SignEditor';

export default async function Page({ params }: { params: Promise<{ signId: string }> }) {
  const { signId } = await params;
  return <SignEditor signId={decodeURIComponent(signId)} />;
}
