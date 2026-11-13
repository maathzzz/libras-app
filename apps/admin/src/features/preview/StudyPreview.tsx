'use client';

import type { StudyBlock } from '@libras/contracts';
import { useState } from 'react';

import { SignThumb } from '@/features/signs/SignThumb';
import { Button } from '@/shared/ui';

import { PhoneFrame } from './PhoneFrame';

// A block as the preview draws it. A sign block whose sign was not picked yet has nothing to
// show but a placeholder.
export type PreviewBlock = StudyBlock | { type: 'pendingSign' };

export interface PreviewPage {
  key: string;
  title: string;
  blocks: PreviewBlock[];
}

function BlockView({ block }: { block: PreviewBlock }) {
  switch (block.type) {
    case 'heading':
      return <p className="col-span-2 pt-2 text-lg font-bold">{block.text}</p>;
    case 'text':
      return <p className="col-span-2 whitespace-pre-line text-text-body">{block.body}</p>;
    case 'tip':
      return (
        <p className="col-span-2 rounded-md bg-warning-soft p-3 whitespace-pre-line text-text-body">
          <span aria-hidden="true">💡 </span>
          {block.body}
        </p>
      );
    case 'pendingSign':
      return (
        <p className="grid min-h-24 place-items-center rounded-md border-2 border-dashed border-border p-2 text-center text-[12px] text-text-muted">
          Sinal ainda não escolhido
        </p>
      );
    case 'sign':
      // A sign with movement spans the whole width, its frames side by side.
      return (
        <div
          className={`grid justify-items-center gap-2 rounded-md bg-surface p-3 shadow-[0_0_0_1px_var(--color-border-subtle)] ${
            block.images.length > 1 ? 'col-span-2' : ''
          }`}
        >
          <p className="text-lg font-bold text-accent">{block.label}</p>
          <div className="flex flex-wrap justify-center gap-1">
            {block.images.map((image, index) => (
              <SignThumb key={`${image.url}-${index}`} url={image.url} alt={image.alt} />
            ))}
          </div>
          {block.description && (
            <p className="text-center text-[13px] text-text-body">{block.description}</p>
          )}
        </div>
      );
  }
}

// The study as the "Estudar" tab shows it, one page at a time.
export function StudyPreview({ title, pages }: { title: string; pages: PreviewPage[] }) {
  const [index, setIndex] = useState(0);
  // Pages may be removed while the preview is open.
  const current = Math.min(index, pages.length - 1);
  const page = pages[current];

  return (
    <PhoneFrame title={title || 'Estudo sem título'}>
      <p className="text-[12px] font-bold tracking-wide text-text-muted uppercase">
        Página {current + 1} de {pages.length}
      </p>
      <p className="text-xl font-bold">{page?.title || 'Página sem título'}</p>
      <div className="grid grid-cols-2 gap-3">
        {page?.blocks.map((block, blockIndex) => (
          <BlockView key={blockIndex} block={block} />
        ))}
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="secondary" disabled={current === 0} onClick={() => setIndex(current - 1)}>
          Anterior
        </Button>
        <Button
          variant="primary"
          disabled={current >= pages.length - 1}
          onClick={() => setIndex(current + 1)}
        >
          Próxima
        </Button>
      </div>
    </PhoneFrame>
  );
}
