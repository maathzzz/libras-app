'use client';

import type { AdminSign, AdminStudy, AdminStudyGroup, SaveStudyRequest } from '@libras/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { getSigns } from '@/features/signs/signsApi';
import { errorMessage } from '@/shared/api/errorMessage';
import { useApiData } from '@/shared/api/useApiData';
import { Button, ContentNotice, ErrorBanner, LoadingText } from '@/shared/ui';

import { createStudy, getStudy, getStudyGroups, updateStudy } from './studiesApi';
import { StudyForm } from './StudyForm';
import { emptyStudy, fromStudy } from './studyDraft';

const backLink = (
  <Link href="/estudos" className="text-accent-dark underline-offset-2 hover:underline">
    ← Estudos
  </Link>
);

interface Loaded {
  groups: AdminStudyGroup[];
  signs: AdminSign[];
  study: AdminStudy | null;
}

// A new study in `groupId` when `studyId` is absent; otherwise edits that study.
export function StudyEditor(props: { studyId: string } | { groupId: string }) {
  const router = useRouter();
  const studyId = 'studyId' in props ? props.studyId : null;
  const load = useCallback(async (): Promise<Loaded> => {
    const [groups, signs, study] = await Promise.all([
      getStudyGroups(),
      getSigns(),
      studyId ? getStudy(studyId) : Promise.resolve(null),
    ]);
    return { groups, signs, study };
  }, [studyId]);
  const { state, reload } = useApiData(load);

  async function save(study: SaveStudyRequest) {
    if (studyId) await updateStudy(studyId, study);
    else await createStudy(study);
    router.push('/estudos');
  }

  if (state.status === 'loading') {
    return (
      <>
        {backLink}
        <LoadingText />
      </>
    );
  }
  if (state.status === 'error') {
    return (
      <>
        {backLink}
        <ErrorBanner
          action={
            <Button variant="secondary" size="sm" onClick={reload}>
              Tentar de novo
            </Button>
          }
        >
          {errorMessage(state.error)}
        </ErrorBanner>
      </>
    );
  }

  const { groups, signs, study } = state.data;
  const groupId = 'groupId' in props ? props.groupId : (study?.groupId ?? '');
  if (!groups.some((group) => group.id === groupId)) {
    return (
      <>
        {backLink}
        <p className="text-text-muted">Este grupo não existe mais.</p>
      </>
    );
  }

  return (
    <>
      {backLink}
      <h1 className="text-2xl font-bold">{study ? study.title : 'Novo estudo'}</h1>
      <ContentNotice />
      <StudyForm
        initial={study ? fromStudy(study) : emptyStudy(groupId)}
        groups={groups}
        signs={signs}
        onSave={save}
        onCancel={() => router.push('/estudos')}
      />
    </>
  );
}
