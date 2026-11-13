'use client';

import type { AdminStudyGroup, AdminStudySummary } from '@libras/contracts';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { AddItem } from '@/features/curriculum/AddItem';
import { moved } from '@/features/curriculum/curriculumApi';
import { OutlineRow } from '@/features/curriculum/OutlineRow';
import { errorMessage } from '@/shared/api/errorMessage';
import { useApiData } from '@/shared/api/useApiData';
import { plural } from '@/shared/plural';
import { Button, buttonClassName, Card, DraftNotice, ErrorBanner, LoadingText } from '@/shared/ui';

import {
  createStudyGroup,
  deleteStudy,
  deleteStudyGroup,
  getStudyGroups,
  renameStudyGroup,
  reorderStudies,
  reorderStudyGroups,
} from './studiesApi';

// Runs one change against the BFF. The list is always reloaded afterwards, also on failure:
// an error usually means the screen is out of date.
type Run = (change: () => Promise<unknown>) => Promise<void>;

function StudyRow({
  study,
  siblings,
  groupId,
  run,
}: {
  study: AdminStudySummary;
  siblings: readonly string[];
  groupId: string;
  run: Run;
}) {
  function confirmDelete() {
    const question = `Excluir o estudo “${study.title}” do rascunho?\n\n${plural(study.pageCount, 'página', 'páginas')} também saem do rascunho.\n\nOs alunos continuam vendo o conteúdo publicado até a próxima publicação.`;
    if (window.confirm(question)) void run(() => deleteStudy(study.id));
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-surface-subtle px-3 py-2">
      <div className="grid min-w-0 gap-0.5">
        <Link
          href={`/estudos/${encodeURIComponent(study.id)}`}
          className="truncate font-semibold text-accent-dark underline-offset-2 hover:underline"
        >
          {study.title}
        </Link>
        <span className="text-[13px] text-text-muted">
          {plural(study.pageCount, 'página', 'páginas')} · {study.description}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Subir “${study.title}”`}
          disabled={siblings[0] === study.id}
          onClick={() => void run(() => reorderStudies(groupId, moved(siblings, study.id, -1)))}
        >
          ↑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Descer “${study.title}”`}
          disabled={siblings.at(-1) === study.id}
          onClick={() => void run(() => reorderStudies(groupId, moved(siblings, study.id, 1)))}
        >
          ↓
        </Button>
        <Button variant="danger" size="sm" onClick={confirmDelete}>
          Excluir
        </Button>
      </div>
    </li>
  );
}

function GroupCard({
  group,
  groupIds,
  run,
}: {
  group: AdminStudyGroup;
  groupIds: readonly string[];
  run: Run;
}) {
  const studyIds = group.studies.map((study) => study.id);

  return (
    <Card className="grid gap-4">
      <OutlineRow
        noun="o grupo"
        title={group.title}
        heading="h2"
        meta={plural(group.studies.length, 'estudo', 'estudos')}
        isFirst={groupIds[0] === group.id}
        isLast={groupIds.at(-1) === group.id}
        onRename={(title) => run(() => renameStudyGroup(group.id, title))}
        onMove={(step) => run(() => reorderStudyGroups(moved(groupIds, group.id, step)))}
        onDelete={() => run(() => deleteStudyGroup(group.id))}
      />
      {group.studies.length === 0 ? (
        <p className="text-[13px] text-text-muted">
          Sem estudos. Um grupo sem estudos não aparece no app.
        </p>
      ) : (
        <ol className="grid gap-1">
          {group.studies.map((study) => (
            <StudyRow
              key={study.id}
              study={study}
              siblings={studyIds}
              groupId={group.id}
              run={run}
            />
          ))}
        </ol>
      )}
      <Link
        href={`/estudos/grupos/${encodeURIComponent(group.id)}/novo`}
        className={`${buttonClassName('ghost', 'sm')} justify-self-start`}
      >
        + Novo estudo
      </Link>
    </Card>
  );
}

export function StudiesPage() {
  const { state, reload } = useApiData(getStudyGroups);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback<Run>(
    async (change) => {
      setError(null);
      try {
        await change();
      } catch (failure) {
        setError(errorMessage(failure));
      } finally {
        reload();
      }
    },
    [reload],
  );

  return (
    <>
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold">Estudos</h1>
        <p className="text-text-muted">
          Páginas de leitura da aba “Estudar”, organizadas em grupos. Não dão XP nem bloqueiam
          lições.
        </p>
      </div>
      <DraftNotice />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {state.status === 'loading' && <LoadingText />}
      {state.status === 'error' && (
        <ErrorBanner
          action={
            <Button variant="secondary" size="sm" onClick={reload}>
              Tentar de novo
            </Button>
          }
        >
          {errorMessage(state.error)}
        </ErrorBanner>
      )}
      {state.status === 'ready' && (
        <>
          {state.data.length === 0 && <p className="text-text-muted">Nenhum grupo ainda.</p>}
          {state.data.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              groupIds={state.data.map((item) => item.id)}
              run={run}
            />
          ))}
          <AddItem label="Novo grupo" onAdd={(title) => run(() => createStudyGroup(title))} />
        </>
      )}
    </>
  );
}
