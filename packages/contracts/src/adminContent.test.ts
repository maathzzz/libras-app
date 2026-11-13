import { describe, expect, it } from 'vitest';

import {
  ReorderRequest,
  SaveExerciseRequest,
  SaveSignRequest,
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
