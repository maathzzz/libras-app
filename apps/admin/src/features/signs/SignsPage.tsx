'use client';

import type { AdminSign } from '@libras/contracts';
import Link from 'next/link';
import { useState } from 'react';

import { errorMessage } from '@/shared/api/errorMessage';
import { useApiData } from '@/shared/api/useApiData';
import { plural } from '@/shared/plural';
import { normalized } from '@/shared/search';
import { Button, DraftNotice, ErrorBanner, inputClassName, LoadingText } from '@/shared/ui';

import { getSigns } from './signsApi';
import { SignThumb } from './SignThumb';

function SignCard({ sign }: { sign: AdminSign }) {
  const [first] = sign.imageUrls;

  return (
    <li>
      <Link
        href={`/sinais/${encodeURIComponent(sign.id)}`}
        className="flex items-center gap-3 rounded-lg bg-surface p-3 shadow-[0_0_0_1px_var(--color-border-subtle)] hover:shadow-[0_0_0_2px_var(--color-accent)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {first && <SignThumb url={first} alt={sign.alt} size="sm" />}
        <div className="grid min-w-0 gap-0.5">
          <span className="truncate font-bold">{sign.label}</span>
          <span className="text-[13px] text-text-muted">
            {plural(sign.exerciseCount, 'exercício', 'exercícios')}
            {sign.imageUrls.length > 1 && ` · ${sign.imageUrls.length} imagens`}
          </span>
          {sign.description === null && (
            <span className="justify-self-start rounded-full bg-warning-soft px-2 text-[11px] font-bold text-warning-dark">
              sem descrição
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

export function SignsPage() {
  const { state, reload } = useApiData(getSigns);
  const [query, setQuery] = useState('');

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold">Sinais</h1>
          <p className="text-text-muted">
            Imagens e descrições usadas pelos exercícios. Um sinal com movimento tem uma imagem por
            etapa.
          </p>
        </div>
        <Link
          href="/sinais/novo"
          className="inline-flex min-h-10 items-center rounded-md bg-success px-4 font-bold text-on-color shadow-[0_3px_0_var(--color-success-dark)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Novo sinal
        </Link>
      </div>
      <DraftNotice />

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
          <input
            type="search"
            aria-label="Buscar sinal"
            placeholder="Buscar pelo nome"
            className={`${inputClassName} max-w-sm`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <SignList signs={state.data} query={query} />
        </>
      )}
    </>
  );
}

function SignList({ signs, query }: { signs: AdminSign[]; query: string }) {
  const wanted = normalized(query.trim());
  const shown = wanted ? signs.filter((sign) => normalized(sign.label).includes(wanted)) : signs;

  if (shown.length === 0) {
    return (
      <p className="text-text-muted">
        {signs.length === 0 ? 'Nenhum sinal ainda.' : 'Nenhum sinal com esse nome.'}
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
      {shown.map((sign) => (
        <SignCard key={sign.id} sign={sign} />
      ))}
    </ul>
  );
}
