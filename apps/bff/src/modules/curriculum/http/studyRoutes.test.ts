import { ErrorResponse, StudiesResponse, StudyGuide } from '@libras/contracts';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app';
import { FixedClock } from '../../../shared/application/FixedClock';
import { createInMemoryContainer } from '../../../testing/inMemoryContainer';
import { createTestTokens, type TestTokens } from '../../../testing/testTokens';
import { InMemoryStudyRepository } from '../testing/InMemoryStudyRepository';

const now = new Date('2026-03-15T12:00:00Z');
const userId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';

const alphabet: StudyGuide = {
  id: 'alfabeto-manual',
  trailId: 'libras-iniciante',
  title: 'Alfabeto manual',
  description: 'As 26 letras em Libras.',
  pages: [
    {
      id: 'letras-a-b',
      title: 'Letras A e B',
      blocks: [
        { type: 'text', body: 'Repita a forma da mão.' },
        {
          type: 'sign',
          label: 'A',
          images: [{ url: 'https://example.com/a.png', alt: 'Mão fechada' }],
          description: 'Mão fechada, polegar ao lado do indicador.',
        },
      ],
    },
    { id: 'dicas', title: 'Dicas', blocks: [{ type: 'tip', body: 'Sem pressa.' }] },
  ],
};

let tokens: TestTokens;
let token: string;

beforeAll(async () => {
  tokens = await createTestTokens();
  token = await tokens.sign(userId, { now });
});

describe('study routes', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    const studies = new InMemoryStudyRepository(
      [
        { id: 'libras-iniciante', title: 'Libras para iniciantes' },
        { id: 'sem-estudos', title: 'Trilha sem estudos' },
      ],
      [alphabet],
    );
    app = buildApp(createInMemoryContainer(new FixedClock(now), { jwks: tokens.jwks, studies }), {
      logger: false,
    });
  });

  const get = (url: string) =>
    app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${token}` } });

  describe('GET /v1/studies', () => {
    it('lists the trails that have studies, with the page count of each study', async () => {
      const response = await get('/v1/studies');

      expect(response.statusCode).toBe(200);
      expect(StudiesResponse.parse(response.json())).toEqual({
        trails: [
          {
            id: 'libras-iniciante',
            title: 'Libras para iniciantes',
            studies: [
              {
                id: 'alfabeto-manual',
                title: 'Alfabeto manual',
                description: 'As 26 letras em Libras.',
                pageCount: 2,
              },
            ],
          },
        ],
      });
    });

    it('answers 401 without a token', async () => {
      const response = await app.inject({ method: 'GET', url: '/v1/studies' });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /v1/studies/:studyId', () => {
    it('answers the study with its pages and the sign descriptions', async () => {
      const response = await get('/v1/studies/alfabeto-manual');

      expect(response.statusCode).toBe(200);
      expect(StudyGuide.parse(response.json())).toEqual(alphabet);
    });

    it('answers 404 STUDY_NOT_FOUND for an unknown study', async () => {
      const response = await get('/v1/studies/nao-existe');

      expect(response.statusCode).toBe(404);
      expect(ErrorResponse.parse(response.json()).error.code).toBe('STUDY_NOT_FOUND');
    });
  });
});
