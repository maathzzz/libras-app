'use client';

import { useState, type ReactNode } from 'react';

import { Button, VisibilityControl } from '@/shared/ui';

import { TitleForm } from './TitleForm';

interface OutlineRowProps {
  // With its article ("a trilha", "o módulo", "a lição"), for the delete confirmation.
  noun: string;
  title: string;
  heading?: 'h2' | 'h3' | 'p';
  meta?: ReactNode;
  // Shown before the other actions (e.g. the link to the exercises of a lesson).
  extraAction?: ReactNode;
  isFirst: boolean;
  isLast: boolean;
  // What else is deleted with this item, for the confirmation.
  deleteWarning?: string | undefined;
  // Trails, units and lessons; study groups have no visibility.
  visibility?: { visible: boolean; onChange: (visible: boolean) => Promise<void> };
  onRename: (title: string) => Promise<void>;
  onMove: (step: -1 | 1) => Promise<void>;
  onDelete: () => Promise<void>;
}

const headingClass = { h2: 'text-lg font-bold', h3: 'font-bold', p: 'font-semibold' } as const;

// One trail, module or lesson with its actions: show or hide, move, rename and delete.
export function OutlineRow({
  noun,
  title,
  heading = 'p',
  meta,
  extraAction,
  isFirst,
  isLast,
  deleteWarning,
  visibility,
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
    const lines = [`Excluir ${noun} “${title}”?`];
    if (deleteWarning) lines.push(deleteWarning);
    lines.push(
      'Os alunos deixam de ver na hora. Se algum aluno já fez uma das lições, a exclusão é recusada: oculte em vez de excluir.',
    );
    if (window.confirm(lines.join('\n\n'))) void onDelete();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-baseline gap-2">
        <Heading className={`${headingClass[heading]} truncate`}>{title}</Heading>
        {meta && <span className="text-[13px] text-text-muted">{meta}</span>}
      </div>
      <div className="flex items-center gap-1">
        {visibility && (
          <VisibilityControl
            visible={visibility.visible}
            name={title}
            onChange={(next) => void visibility.onChange(next)}
          />
        )}
        {extraAction}
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
