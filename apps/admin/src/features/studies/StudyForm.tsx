'use client';

import {
  STUDY_MAX_PAGES,
  STUDY_PAGE_MAX_BLOCKS,
  type AdminSign,
  type AdminStudyGroup,
  type SaveStudyRequest,
} from '@libras/contracts';
import { useState, type FormEvent } from 'react';

import { StudyPreview } from '@/features/preview/StudyPreview';
import { errorMessage } from '@/shared/api/errorMessage';
import {
  Button,
  Card,
  ErrorBanner,
  hintClassName,
  inputClassName,
  labelClassName,
} from '@/shared/ui';

import { BlockEditor, blockNames } from './BlockEditor';
import {
  movedItem,
  newBlock,
  newPage,
  toPreviewPages,
  toRequest,
  type DraftBlock,
  type DraftBlockType,
  type DraftPage,
  type StudyDraft,
} from './studyDraft';

interface StudyFormProps {
  initial: StudyDraft;
  groups: readonly AdminStudyGroup[];
  signs: readonly AdminSign[];
  onSave: (study: SaveStudyRequest) => Promise<void>;
  onCancel: () => void;
}

const blockTypes: DraftBlockType[] = ['heading', 'text', 'sign', 'tip'];

function PageEditor({
  page,
  number,
  pageCount,
  signs,
  signsById,
  onChange,
  onMove,
  onRemove,
}: {
  page: DraftPage;
  number: number;
  pageCount: number;
  signs: readonly AdminSign[];
  signsById: ReadonlyMap<string, AdminSign>;
  onChange: (page: DraftPage) => void;
  onMove: (step: -1 | 1) => void;
  onRemove: () => void;
}) {
  const setBlocks = (blocks: DraftBlock[]) => onChange({ ...page, blocks });
  const full = page.blocks.length >= STUDY_PAGE_MAX_BLOCKS;

  return (
    <li>
      <Card className="grid gap-4" aria-label={`Página ${number}`}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label className={`${labelClassName} min-w-64 flex-1`}>
            Título da página {number}
            <input
              className={inputClassName}
              value={page.title}
              maxLength={80}
              onChange={(event) => onChange({ ...page, title: event.target.value })}
            />
          </label>
          <div className="flex">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Subir página ${number}`}
              disabled={number === 1}
              onClick={() => onMove(-1)}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Descer página ${number}`}
              disabled={number === pageCount}
              onClick={() => onMove(1)}
            >
              ↓
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={pageCount === 1}
              onClick={() => {
                if (window.confirm(`Remover a página ${number} e todo o seu conteúdo?`)) onRemove();
              }}
            >
              Remover página
            </Button>
          </div>
        </div>

        {page.blocks.length === 0 && (
          <p className={hintClassName}>A página precisa de ao menos um bloco.</p>
        )}
        <ol className="grid gap-2">
          {page.blocks.map((block, index) => (
            <BlockEditor
              key={block.key}
              block={block}
              number={index + 1}
              signs={signs}
              signsById={signsById}
              isFirst={index === 0}
              isLast={index === page.blocks.length - 1}
              onChange={(next) =>
                setBlocks(page.blocks.map((item, i) => (i === index ? next : item)))
              }
              onMove={(step) => setBlocks(movedItem(page.blocks, index, step))}
              onRemove={() => setBlocks(page.blocks.filter((_, i) => i !== index))}
            />
          ))}
        </ol>

        <div className="flex flex-wrap gap-2">
          {blockTypes.map((type) => (
            <Button
              key={type}
              variant="secondary"
              size="sm"
              disabled={full}
              onClick={() => setBlocks([...page.blocks, newBlock(type)])}
            >
              + {blockNames[type]}
            </Button>
          ))}
        </div>
      </Card>
    </li>
  );
}

export function StudyForm({ initial, groups, signs, onSave, onCancel }: StudyFormProps) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const signsById = new Map(signs.map((sign) => [sign.id, sign]));
  const request = toRequest(draft);
  const setPages = (pages: DraftPage[]) => setDraft({ ...draft, pages });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!request.success) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(request.data);
    } catch (failure) {
      setError(errorMessage(failure));
      setSaving(false);
    }
  }

  return (
    <form
      className={`grid items-start gap-6 ${previewing ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}
      onSubmit={submit}
      aria-label="Estudo"
    >
      <div className="grid gap-6">
        <Button
          variant="secondary"
          className="justify-self-start"
          onClick={() => setPreviewing((open) => !open)}
        >
          {previewing ? 'Fechar prévia' : 'Pré-visualizar'}
        </Button>
        {error && <ErrorBanner>{error}</ErrorBanner>}

        <Card className="grid max-w-3xl gap-5">
          <label className={labelClassName}>
            Título
            <input
              className={inputClassName}
              value={draft.title}
              maxLength={80}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </label>
          <label className={labelClassName}>
            Descrição
            <input
              className={inputClassName}
              value={draft.description}
              maxLength={200}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
            <span className={hintClassName}>Uma frase, mostrada na lista da aba “Estudar”.</span>
          </label>
          <label className={labelClassName}>
            Grupo
            <select
              className={`${inputClassName} max-w-sm`}
              value={draft.groupId}
              onChange={(event) => setDraft({ ...draft, groupId: event.target.value })}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
            <span className={hintClassName}>
              Mudar de grupo coloca o estudo no fim do novo grupo.
            </span>
          </label>
        </Card>

        <ol className="grid gap-4">
          {draft.pages.map((page, index) => (
            <PageEditor
              key={page.key}
              page={page}
              number={index + 1}
              pageCount={draft.pages.length}
              signs={signs}
              signsById={signsById}
              onChange={(next) =>
                setPages(draft.pages.map((item, i) => (i === index ? next : item)))
              }
              onMove={(step) => setPages(movedItem(draft.pages, index, step))}
              onRemove={() => setPages(draft.pages.filter((_, i) => i !== index))}
            />
          ))}
        </ol>
        <Button
          variant="secondary"
          className="justify-self-start"
          disabled={draft.pages.length >= STUDY_MAX_PAGES}
          onClick={() => setPages([...draft.pages, newPage()])}
        >
          + Nova página
        </Button>

        <div className="grid gap-2">
          {!request.success && (
            <p className={hintClassName}>
              Para salvar, preencha o título, a descrição, o título de cada página e todos os
              blocos, e escolha o sinal de cada bloco de sinal.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="primary" type="submit" disabled={!request.success || saving}>
              {saving ? 'Salvando…' : 'Salvar estudo'}
            </Button>
            <Button variant="secondary" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
      {previewing && (
        <aside className="xl:sticky xl:top-4" aria-label="Prévia do estudo">
          <StudyPreview title={draft.title} pages={toPreviewPages(draft, signsById)} />
        </aside>
      )}
    </form>
  );
}
