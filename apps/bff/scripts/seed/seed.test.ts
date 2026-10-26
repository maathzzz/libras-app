import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { buildSeedContent } from './content';
import { renderSeedSql, SEED_FILE } from './seedSql';

describe('seed content', () => {
  const content = buildSeedContent();

  it('has the five units of the course, in order', () => {
    expect(content.units.map((unit) => unit.title)).toEqual([
      'Alfabeto e numerais',
      'Saudações',
      'Objetos do cotidiano',
      'Família e parentes',
      'Conversa 1',
    ]);
  });

  it('teaches every letter and the numbers 0 to 10', () => {
    const taught = new Set(content.exercises.map(({ payload }) => payload.correctOptionId));
    expect(taught).toEqual(new Set(content.signs.map((sign) => sign.id)));
    expect(content.signs).toHaveLength(26 + 11);
  });

  it('only uses known signs and unique exercise ids', () => {
    const signIds = new Set(content.signs.map((sign) => sign.id));
    const exerciseIds = content.exercises.map(({ payload }) => payload.id);

    expect(new Set(exerciseIds).size).toBe(exerciseIds.length);
    for (const exercise of content.exercises) {
      expect(exercise.signIds.every((id) => signIds.has(id))).toBe(true);
    }
  });

  it('matches the committed supabase/seed.sql', async () => {
    // Fails when content.ts changes without running `pnpm --filter bff db:seed:generate`.
    const committed = await readFile(SEED_FILE, 'utf8');
    expect(committed.replaceAll('\r\n', '\n')).toBe(renderSeedSql(content));
  });
});
