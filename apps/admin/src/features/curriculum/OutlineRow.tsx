'use client';

import { useState, type ReactNode } from 'react';

import { Button } from '@/shared/ui';

import { TitleForm } from './TitleForm';

interface OutlineRowProps {
  // With its article ("a trilha", "o módulo", "a lição"), for the delete confirmation.
  noun: string;
  title: string;
  heading?: 'h2' | 'h3' | 'p';
  meta?: ReactNode;
  isFirst: boolean;
  isLast: boolean;
  // What else disappears from the draft with this item, for the confirmation.
  deleteWarning?: string | undefined;
  onRename: (title: string) => Promise<void>;
  onMove: (step: -1 | 1) => Promise<void>;
  onDelete: () => Promise<void>;
}

const headingClass = { h2: 'text-lg font-bold', h3: 'font-bold', p: 'font-semibold' } as const;

// One trail, module or lesson with its actions: rename, move up or down and delete.
export function OutlineRow({
  noun,
  title,
  heading = 'p',
  meta,
  isFirst,
  isLast,
  deleteWarning,
  onRename,
  onMove,
  onDelete,
}: OutlineRowProps) {
  const [renaming, setRenaming] = useState(false);
  const Heading = heading;

  if (renaming) {
    return (
      <TitleForm
        label={`Novo nome para “${title}”`}
        initialTitle={title}
        submitLabel="Salvar"
        onSubmit={async (next) => {
          await onRename(next);
          setRenaming(false);
        }}
        onCancel={() => setRenaming(false)}
      />
    );
  }

  function confirmDelete() {
    const lines = [`Excluir ${noun} “${title}” do rascunho?`];
    if (deleteWarning) lines.push(deleteWarning);
    lines.push('Os alunos continuam vendo o conteúdo publicado até a próxima publicação.');
    if (window.confirm(lines.join('\n\n'))) void onDelete();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-baseline gap-2">
        <Heading className={`${headingClass[heading]} truncate`}>{title}</Heading>
        {meta && <span className="text-[13px] text-text-muted">{meta}</span>}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Subir “${title}”`}
          disabled={isFirst}
          onClick={() => void onMove(-1)}
        >
          ↑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Descer “${title}”`}
          disabled={isLast}
          onClick={() => void onMove(1)}
        >
          ↓
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setRenaming(true)}>
          Renomear
        </Button>
        <Button variant="danger" size="sm" onClick={confirmDelete}>
          Excluir
        </Button>
      </div>
    </div>
  );
}
