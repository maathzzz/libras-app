import { describe, expect, it } from 'vitest';

import {
  ReorderRequest,
  SaveExerciseRequest,
  SaveSignRequest,
  SaveStudyRequest,
  SaveTitleRequest,
} from './adminContent';

describe('admin content contracts', () => {
  it('trims titles and refuses an empty one', () => {
    expect(SaveTitleRequest.parse({ title: '  Saudações ' })).toEqual({ title: 'Saudações' });
    expect(SaveTitleRequest.safeParse({ title: '   ' }).success).toBe(false);
    expect(SaveTitleRequest.safeParse({ title: 'a'.repeat(81) }).success).toBe(false);
  });

  it('refuses an order with a repeated id', () => {
    expect(ReorderRequest.safeParse({ ids: ['a', 'b'] }).success).toBe(true);
    expect(ReorderRequest.safeParse({ ids: ['a', 'a'] }).success).toBe(false);
    expect(ReorderRequest.safeParse({ ids: [] }).success).toBe(false);
  });

  it('needs at least one image for a sign and accepts a sign without description', () => {
    const sign = { label: 'A', imageUrls: ['https://x.test/a.webp'], alt: 'Mão fechada' };

    expect(SaveSignRequest.safeParse({ ...sign, description: null }).success).toBe(true);
    expect(SaveSignRequest.safeParse({ ...sign, imageUrls: [], description: null }).success).toBe(
      false,
    );
    expect(SaveSignRequest.safeParse({ ...sign, description: '' }).success).toBe(false);
  });
});

describe('exercise contracts', () => {
  const exercise = { type: 'sign_to_word', signIds: ['a', 'b', 'c'], correctSignId: 'b' };

  it('accepts two to four different signs with the correct one among them', () => {
    expect(SaveExerciseRequest.safeParse(exercise).success).toBe(true);
    expect(SaveExerciseRequest.safeParse({ ...exercise, signIds: ['b'] }).success).toBe(false);
    expect(
      SaveExerciseRequest.safeParse({ ...exercise, signIds: ['a', 'b', 'c', 'd', 'e'] }).success,
    ).toBe(false);
    expect(SaveExerciseRequest.safeParse({ ...exercise, signIds: ['a', 'b', 'b'] }).success).toBe(
      false,
    );
    expect(SaveExerciseRequest.safeParse({ ...exercise, correctSignId: 'z' }).success).toBe(false);
  });

  it('refuses a type the CMS does not edit', () => {
    expect(SaveExerciseRequest.safeParse({ ...exercise, type: 'handshape' }).success).toBe(false);
  });
});

describe('study contracts', () => {
  const study = {
    groupId: 'iniciante',
    title: 'Cores',
    description: 'As cores mais usadas.',
    pages: [
      {
        title: 'Primárias',
        blocks: [
          { type: 'heading', text: 'Vermelho' },
          { type: 'sign', signId: 'sign-vermelho' },
        ],
      },
    ],
  };

  it('accepts new pages without an id and sign blocks that name a sign', () => {
    expect(SaveStudyRequest.safeParse(study).success).toBe(true);
  });

  it('refuses an empty study or page and a repeated page id', () => {
    expect(SaveStudyRequest.safeParse({ ...study, pages: [] }).success).toBe(false);
    expect(
      SaveStudyRequest.safeParse({ ...study, pages: [{ title: 'Vazia', blocks: [] }] }).success,
    ).toBe(false);
    const page = { id: 'p1', title: 'P', blocks: [{ type: 'text', body: 'Oi' }] };
    expect(SaveStudyRequest.safeParse({ ...study, pages: [page, page] }).success).toBe(false);
  });
});
