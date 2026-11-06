import type { StudyBlock } from '@libras/contracts';

type SignBlock = Extract<StudyBlock, { type: 'sign' }>;

/**
 * A line of the page: a block alone across the whole width, or one or two single-frame
 * signs side by side.
 */
export type StudyRow = { kind: 'full'; block: StudyBlock } | { kind: 'signs'; signs: SignBlock[] };

export function pagesLabel(count: number): string {
  return count === 1 ? '1 página' : `${count} páginas`;
}

/** One header segment per page: pages already reached are full. */
export function studySteps(pageCount: number, pageIndex: number): number[] {
  return Array.from({ length: pageCount }, (_, index) => (index <= pageIndex ? 1 : 0));
}

// Single-frame signs sit two per row. A sign with several frames needs the whole row to keep
// its frames as big as the others', so it breaks the pairing, and the sign before it may be
// left alone in its row. The order of the blocks is never changed: it is the teaching order.
export function studyRows(blocks: readonly StudyBlock[]): StudyRow[] {
  const rows: StudyRow[] = [];
  for (const block of blocks) {
    if (block.type !== 'sign' || block.images.length > 1) {
      rows.push({ kind: 'full', block });
      continue;
    }

    const last = rows[rows.length - 1];
    if (last?.kind === 'signs' && last.signs.length < 2) {
      last.signs.push(block);
    } else {
      rows.push({ kind: 'signs', signs: [block] });
    }
  }
  return rows;
}

type FrameSizeInput = {
  /** Room for frames inside a half-width card (a single-frame sign). */
  columnInner: number;
  /** Room for frames inside a full-width card. */
  fullInner: number;
  frameCount: number;
  frameGap: number;
  maxFrame: number;
};

// Every frame on the page has the size of a single-frame sign, so a sign with movement does
// not look bigger or smaller than its neighbors. It only shrinks when its frames would not fit
// side by side across the whole width.
export function signFrameSize({
  columnInner,
  fullInner,
  frameCount,
  frameGap,
  maxFrame,
}: FrameSizeInput): number {
  const pageFrame = Math.min(maxFrame, columnInner);
  if (frameCount <= 1) return pageFrame;

  const fitting = (fullInner - frameGap * (frameCount - 1)) / frameCount;
  return Math.min(pageFrame, fitting);
}
