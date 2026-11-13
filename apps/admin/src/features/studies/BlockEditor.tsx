'use client';

import type { AdminSign } from '@libras/contracts';

import { SignSearch } from '@/features/signs/SignSearch';
import { SignThumb } from '@/features/signs/SignThumb';
import {
  Button,
  hintClassName,
  inputClassName,
  labelClassName,
  textareaClassName,
} from '@/shared/ui';

import type { DraftBlock, DraftBlockType } from './studyDraft';

export const blockNames: Record<DraftBlockType, string> = {
  heading: 'Subtítulo',
  text: 'Texto',
  sign: 'Sinal',
  tip: 'Dica',
};

interface BlockEditorProps {
  block: DraftBlock;
  // Position in the page, from 1, for the accessible names.
  number: number;
  signsById: ReadonlyMap<string, AdminSign>;
  signs: readonly AdminSign[];
  isFirst: boolean;
  isLast: boolean;
  onChange: (block: DraftBlock) => void;
  onMove: (step: -1 | 1) => void;
  onRemove: () => void;
}

function SignField({
  block,
  signs,
  signsById,
  onChange,
}: {
  block: Extract<DraftBlock, { type: 'sign' }>;
  signs: readonly AdminSign[];
  signsById: ReadonlyMap<string, AdminSign>;
  onChange: (block: DraftBlock) => void;
}) {
  const sign = block.signId ? signsById.get(block.signId) : undefined;

  if (sign) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {sign.imageUrls.map((url, index) => (
          <SignThumb key={url} url={url} alt={`${sign.alt} (${index + 1})`} size="sm" />
        ))}
        <span className="font-bold">{sign.label}</span>
        <Button variant="secondary" size="sm" onClick={() => onChange({ ...block, signId: null })}>
          Trocar sinal
        </Button>
        {sign.description === null && (
          <span className={hintClassName}>
            Sem descrição: o app mostra só as imagens até alguém escrevê-la no sinal.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      {block.oldLabel && (
        <p className="text-[13px] font-semibold text-warning-dark">
          Este bloco mostrava “{block.oldLabel}”, mas não está ligado a um sinal cadastrado. Escolha
          o sinal de novo.
        </p>
      )}
      {block.signId && !sign && (
        <p className="text-[13px] font-semibold text-warning-dark">
          O sinal deste bloco não existe mais. Escolha outro.
        </p>
      )}
      <SignSearch
        signs={signs}
        label="Escolher sinal"
        onPick={(picked) => onChange({ key: block.key, type: 'sign', signId: picked.id })}
      />
    </div>
  );
}

// One block of a study page with its field and its actions.
export function BlockEditor({
  block,
  number,
  signs,
  signsById,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
}: BlockEditorProps) {
  const name = `${blockNames[block.type]} ${number}`;

  return (
    <li className="grid gap-2 rounded-sm bg-surface-subtle p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-text-muted">{blockNames[block.type]}</span>
        <div className="flex">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Subir ${name}`}
            disabled={isFirst}
            onClick={() => onMove(-1)}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Descer ${name}`}
            disabled={isLast}
            onClick={() => onMove(1)}
          >
            ↓
          </Button>
          <Button variant="ghost" size="sm" aria-label={`Remover ${name}`} onClick={onRemove}>
            ✕
          </Button>
        </div>
      </div>

      {block.type === 'heading' && (
        <label className={labelClassName}>
          <span className="sr-only">{name}</span>
          <input
            className={inputClassName}
            value={block.text}
            maxLength={80}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
          />
        </label>
      )}
      {(block.type === 'text' || block.type === 'tip') && (
        <label className={labelClassName}>
          <span className="sr-only">{name}</span>
          <textarea
            className={textareaClassName}
            value={block.body}
            maxLength={2000}
            onChange={(event) => onChange({ ...block, body: event.target.value })}
          />
        </label>
      )}
      {block.type === 'sign' && (
        <SignField block={block} signs={signs} signsById={signsById} onChange={onChange} />
      )}
    </li>
  );
}
