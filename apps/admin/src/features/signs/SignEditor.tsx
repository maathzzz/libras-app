'use client';

import type { AdminSign, SaveSignRequest } from '@libras/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { errorMessage } from '@/shared/api/errorMessage';
import { useApiData } from '@/shared/api/useApiData';
import { plural } from '@/shared/plural';
import { Button, DraftNotice, ErrorBanner, LoadingText } from '@/shared/ui';

import { SignForm } from './SignForm';
import { createSign, deleteSign, getSigns, updateSign } from './signsApi';

const backLink = (
  <Link href="/sinais" className="text-accent-dark underline-offset-2 hover:underline">
    ← Sinais
  </Link>
);

// New sign when `signId` is absent; otherwise edits that sign.
export function SignEditor({ signId }: { signId?: string }) {
  if (!signId) return <NewSign />;
  return <EditSign signId={signId} />;
}

function NewSign() {
  const router = useRouter();

  async function save(sign: SaveSignRequest) {
    await createSign(sign);
    router.push('/sinais');
  }

  return (
    <>
      {backLink}
      <h1 className="text-2xl font-bold">Novo sinal</h1>
      <DraftNotice />
      <SignForm onSave={save} onCancel={() => router.push('/sinais')} />
    </>
  );
}

function EditSign({ signId }: { signId: string }) {
  const { state, reload } = useApiData(getSigns);

  return (
    <>
      {backLink}
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
        <LoadedSign sign={state.data.find((candidate) => candidate.id === signId)} />
      )}
    </>
  );
}

function LoadedSign({ sign }: { sign: AdminSign | undefined }) {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!sign) {
    return <p className="text-text-muted">Este sinal não existe mais no rascunho.</p>;
  }

  async function save(changes: SaveSignRequest) {
    if (!sign) return;
    await updateSign(sign.id, changes);
    router.push('/sinais');
  }

  async function remove() {
    if (!sign) return;
    const question = `Excluir o sinal “${sign.label}” do rascunho?\n\nOs alunos continuam vendo o conteúdo publicado até a próxima publicação.`;
    if (!window.confirm(question)) return;
    try {
      await deleteSign(sign.id);
      router.push('/sinais');
    } catch (failure) {
      setDeleteError(errorMessage(failure));
    }
  }

  const inUse = sign.exerciseCount > 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{sign.label}</h1>
        <div className="flex items-center gap-3">
          {inUse && (
            <span className="text-[13px] text-text-muted">
              Usado em {plural(sign.exerciseCount, 'exercício', 'exercícios')}: não pode ser
              excluído.
            </span>
          )}
          <Button variant="danger" size="sm" disabled={inUse} onClick={() => void remove()}>
            Excluir sinal
          </Button>
        </div>
      </div>
      <DraftNotice />
      {deleteError && <ErrorBanner>{deleteError}</ErrorBanner>}
      <SignForm initial={sign} onSave={save} onCancel={() => router.push('/sinais')} />
    </>
  );
}
