import {
  SaveStudyRequest,
  type AdminSign,
  type AdminStudy,
  type StudyBlock,
} from '@libras/contracts';

import type { PreviewBlock, PreviewPage } from '@/features/preview/StudyPreview';

// What the study editor holds while the operator types. `key` identifies an item on screen
// (React keys), apart from the page id, which only existing pages have.

export type DraftBlock =
  | { key: string; type: 'heading'; text: string }
  | { key: string; type: 'text'; body: string }
  | { key: string; type: 'tip'; body: string }
  // `signId` is null until a sign is picked. A block from before the CMS has no signId and
  // shows the label it was copied with, so the operator knows which sign to pick again.
  | { key: string; type: 'sign'; signId: string | null; oldLabel?: string };

export type DraftBlockType = DraftBlock['type'];

export interface DraftPage {
  key: string;
  id?: string;
  title: string;
  blocks: DraftBlock[];
}

export interface StudyDraft {
  groupId: string;
  title: string;
  description: string;
  pages: DraftPage[];
}

let lastKey = 0;
export const newKey = () => `k${++lastKey}`;

export function newBlock(type: DraftBlockType): DraftBlock {
  const key = newKey();
  switch (type) {
    case 'heading':
      return { key, type, text: '' };
    case 'text':
    case 'tip':
      return { key, type, body: '' };
    case 'sign':
      return { key, type, signId: null };
  }
}

export const newPage = (): DraftPage => ({ key: newKey(), title: '', blocks: [newBlock('text')] });

export const emptyStudy = (groupId: string): StudyDraft => ({
  groupId,
  title: '',
  description: '',
  pages: [newPage()],
});

function fromBlock(block: StudyBlock): DraftBlock {
  const key = newKey();
  if (block.type !== 'sign') return { key, ...block };
  return block.signId
    ? { key, type: 'sign', signId: block.signId }
    : { key, type: 'sign', signId: null, oldLabel: block.label };
}

export function fromStudy(study: AdminStudy): StudyDraft {
  return {
    groupId: study.groupId,
    title: study.title,
    description: study.description,
    pages: study.pages.map((page) => ({
      key: newKey(),
      id: page.id,
      title: page.title,
      blocks: page.blocks.map(fromBlock),
    })),
  };
}

function toBlock(block: DraftBlock) {
  switch (block.type) {
    case 'heading':
      return { type: block.type, text: block.text };
    case 'text':
    case 'tip':
      return { type: block.type, body: block.body };
    case 'sign':
      return { type: block.type, signId: block.signId };
  }
}

// The request to save, or why it cannot be sent yet.
export function toRequest(draft: StudyDraft) {
  return SaveStudyRequest.safeParse({
    groupId: draft.groupId,
    title: draft.title,
    description: draft.description,
    pages: draft.pages.map((page) => ({
      ...(page.id ? { id: page.id } : {}),
      title: page.title,
      blocks: page.blocks.map(toBlock),
    })),
  });
}

// The list with the item at `index` moved one place up (-1) or down (+1).
export function movedItem<T>(items: readonly T[], index: number, step: -1 | 1): T[] {
  const to = index + step;
  if (index < 0 || index >= items.length || to < 0 || to >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

function previewBlock(block: DraftBlock, signsById: ReadonlyMap<string, AdminSign>): PreviewBlock {
  if (block.type === 'heading') return { type: 'heading', text: block.text };
  if (block.type !== 'sign') return { type: block.type, body: block.body };

  const sign = block.signId ? signsById.get(block.signId) : undefined;
  if (!sign) return { type: 'pendingSign' };
  // The same copy the BFF makes when saving.
  return {
    type: 'sign',
    label: sign.label,
    images: sign.imageUrls.map((url) => ({ url, alt: sign.alt })),
    ...(sign.description ? { description: sign.description } : {}),
  };
}

// The pages as the app would show them, from what is in the form now (saved or not).
export function toPreviewPages(
  draft: StudyDraft,
  signsById: ReadonlyMap<string, AdminSign>,
): PreviewPage[] {
  return draft.pages.map((page) => ({
    key: page.key,
    title: page.title,
    blocks: page.blocks.map((block) => previewBlock(block, signsById)),
  }));
}
