import {
  AdminLessonExercisesResponse,
  AdminSignsResponse,
  AdminStudiesResponse,
  AdminStudy,
  AdminTrailsResponse,
  CreatedResponse,
  ErrorResponse,
  SignImageUploadResponse,
} from '@libras/contracts';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app';
import { FixedClock } from '../../../shared/application/FixedClock';
import { createInMemoryContainer } from '../../../testing/inMemoryContainer';
import { createTestTokens, type TestTokens } from '../../../testing/testTokens';
import { InMemoryAdminRepository } from '../../admin/testing/InMemoryAdminRepository';
import { InMemoryCmsExercises } from '../testing/InMemoryCmsExercises';
import { InMemoryCmsOutline } from '../testing/InMemoryCmsOutline';
import { InMemoryCmsSigns } from '../testing/InMemoryCmsSigns';
import { InMemoryCmsStudies } from '../testing/InMemoryCmsStudies';

const now = new Date('2026-03-15T12:00:00Z');
const operatorId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';
const learnerId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e03';

let tokens: TestTokens;

beforeAll(async () => {
  tokens = await createTestTokens();
});

describe('authoring routes', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    const admins = new InMemoryAdminRepository([
      { userId: operatorId, email: 'ana@example.com', name: 'Ana', active: true },
    ]);
    const outline = new InMemoryCmsOutline([
      {
        id: 'basico',
        title: 'Libras básico',
        visible: true,
        units: [
          { id: 'alfabeto', title: 'Alfabeto', visible: true, lessons: [] },
          { id: 'numeros', title: 'Números', visible: true, lessons: [] },
        ],
      },
    ]);
    const cmsSigns = new InMemoryCmsSigns([
      {
        id: 'letter-a',
        label: 'A',
        imageUrls: ['https://x.test/a.webp'],
        alt: 'Mão fechada',
        description: null,
        exerciseCount: 2,
        studyCount: 0,
      },
      {
        id: 'letter-b',
        label: 'B',
        imageUrls: ['https://x.test/b.webp'],
        alt: 'Mão aberta, polegar dobrado',
        description: null,
        exerciseCount: 0,
        studyCount: 0,
      },
    ]);
    const cmsExercises = new InMemoryCmsExercises([
      { lesson: { id: 'vogais', title: 'Vogais' }, exercises: [] },
    ]);
    const cmsStudies = new InMemoryCmsStudies([{ id: 'iniciante', title: 'Primeiros passos' }]);
    app = buildApp(
      createInMemoryContainer(new FixedClock(now), {
        jwks: tokens.jwks,
        admins,
        outline,
        cmsSigns,
        cmsExercises,
        cmsStudies,
      }),
      { logger: false },
    );
  });

  const send = async (
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    payload?: object,
    userId = operatorId,
  ) =>
    app.inject({
      method,
      url,
      headers: {
        authorization: `Bearer ${await tokens.sign(userId, { now, operator: userId === operatorId })}`,
      },
      ...(payload ? { payload } : {}),
    });

  const errorCode = (response: Awaited<ReturnType<typeof send>>) =>
    ErrorResponse.parse(response.json()).error.code;

  const trails = async () =>
    AdminTrailsResponse.parse((await send('GET', '/v1/admin/trails')).json());

  it('keeps learners out', async () => {
    const response = await send('GET', '/v1/admin/trails', undefined, learnerId);

    expect(response.statusCode).toBe(403);
    expect(errorCode(response)).toBe('NOT_ADMIN');
  });

  it('creates a lesson in a unit and lists it', async () => {
    const response = await send('POST', '/v1/admin/units/alfabeto/lessons', { title: ' A a E ' });

    expect(response.statusCode).toBe(201);
    const { id } = CreatedResponse.parse(response.json());
    const lessons = (await trails()).trails[0]?.units[0]?.lessons;
    expect(lessons).toEqual([{ id, title: 'A a E', visible: false, exerciseCount: 0 }]);
  });

  it('creates a trail and a unit inside it', async () => {
    const trail = CreatedResponse.parse(
      (await send('POST', '/v1/admin/trails', { title: 'Nova' })).json(),
    );
    const unit = await send('POST', `/v1/admin/trails/${trail.id}/units`, { title: 'Cores' });

    expect(unit.statusCode).toBe(201);
    expect((await trails()).trails[1]?.units.map((item) => item.title)).toEqual(['Cores']);
  });

  it('renames, reorders and deletes units', async () => {
    expect((await send('PATCH', '/v1/admin/units/numeros', { title: 'Numerais' })).statusCode).toBe(
      204,
    );
    expect(
      (await send('PUT', '/v1/admin/trails/basico/units/order', { ids: ['numeros', 'alfabeto'] }))
        .statusCode,
    ).toBe(204);
    expect((await send('DELETE', '/v1/admin/units/alfabeto')).statusCode).toBe(204);

    expect((await trails()).trails[0]?.units).toEqual([
      { id: 'numeros', title: 'Numerais', visible: true, lessons: [] },
    ]);
  });

  it('answers 404 for an unknown item and 422 for a stale order', async () => {
    const missing = await send('PATCH', '/v1/admin/lessons/nope', { title: 'X' });
    const stale = await send('PUT', '/v1/admin/trails/basico/units/order', { ids: ['alfabeto'] });

    expect([missing.statusCode, errorCode(missing)]).toEqual([404, 'LESSON_NOT_FOUND']);
    expect([stale.statusCode, errorCode(stale)]).toEqual([422, 'INVALID_ORDER']);
  });

  it('shows and hides a unit', async () => {
    const shown = await send('PUT', '/v1/admin/units/numeros/visibility', { visible: false });
    const missing = await send('PUT', '/v1/admin/lessons/nope/visibility', { visible: true });

    expect(shown.statusCode).toBe(204);
    expect((await trails()).trails[0]?.units[1]?.visible).toBe(false);
    expect([missing.statusCode, errorCode(missing)]).toEqual([404, 'LESSON_NOT_FOUND']);
  });

  it('answers 400 for an empty title', async () => {
    const response = await send('POST', '/v1/admin/trails', { title: '   ' });

    expect(response.statusCode).toBe(400);
  });

  describe('signs', () => {
    const sign = {
      label: 'Oi',
      imageUrls: ['https://x.test/oi.webp'],
      alt: 'Mão aberta acenando',
      description: null,
    };

    it('creates, updates and lists a sign', async () => {
      const created = await send('POST', '/v1/admin/signs', sign);
      const { id } = CreatedResponse.parse(created.json());
      const updated = await send('PUT', `/v1/admin/signs/${id}`, { ...sign, label: 'Olá' });

      expect([created.statusCode, updated.statusCode]).toEqual([201, 204]);
      const { signs } = AdminSignsResponse.parse((await send('GET', '/v1/admin/signs')).json());
      expect(signs.map((item) => item.label)).toEqual(['A', 'B', 'Olá']);
    });

    it('answers 409 when deleting a sign in use', async () => {
      const response = await send('DELETE', '/v1/admin/signs/letter-a');

      expect([response.statusCode, errorCode(response)]).toEqual([409, 'SIGN_IN_USE']);
    });

    it('authorizes an image upload of an accepted type only', async () => {
      const accepted = await send('POST', '/v1/admin/signs/uploads', { contentType: 'image/png' });
      const refused = await send('POST', '/v1/admin/signs/uploads', { contentType: 'image/gif' });

      expect(accepted.statusCode).toBe(200);
      expect(SignImageUploadResponse.parse(accepted.json()).imageUrl).toMatch(/\.png$/);
      expect(refused.statusCode).toBe(400);
    });
  });

  describe('exercises', () => {
    const exercise = {
      type: 'sign_to_word',
      signIds: ['letter-b', 'letter-a'],
      correctSignId: 'letter-a',
    };
    const listed = async () =>
      AdminLessonExercisesResponse.parse(
        (await send('GET', '/v1/admin/lessons/vogais/exercises')).json(),
      ).exercises;

    it('creates, replaces, reorders and deletes exercises of a lesson', async () => {
      const created = await send('POST', '/v1/admin/lessons/vogais/exercises', exercise);
      const { id } = CreatedResponse.parse(created.json());
      const second = CreatedResponse.parse(
        (await send('POST', '/v1/admin/lessons/vogais/exercises', exercise)).json(),
      );
      const replaced = await send('PUT', `/v1/admin/exercises/${id}`, {
        ...exercise,
        type: 'word_to_sign',
      });
      const reordered = await send('PUT', '/v1/admin/lessons/vogais/exercises/order', {
        ids: [second.id, id],
      });

      expect([created.statusCode, replaced.statusCode, reordered.statusCode]).toEqual([
        201, 204, 204,
      ]);
      expect((await listed()).map((item) => [item.id, item.type])).toEqual([
        [second.id, 'sign_to_word'],
        [id, 'word_to_sign'],
      ]);

      expect((await send('DELETE', `/v1/admin/exercises/${second.id}`)).statusCode).toBe(204);
      expect((await listed()).map((item) => item.id)).toEqual([id]);
    });

    it('answers 404 for an unknown lesson and 422 for an unknown sign', async () => {
      const noLesson = await send('GET', '/v1/admin/lessons/nope/exercises');
      const unknownSign = await send('POST', '/v1/admin/lessons/vogais/exercises', {
        ...exercise,
        signIds: ['letter-a', 'nope'],
      });

      expect([noLesson.statusCode, errorCode(noLesson)]).toEqual([404, 'LESSON_NOT_FOUND']);
      expect([unknownSign.statusCode, errorCode(unknownSign)]).toEqual([422, 'UNKNOWN_SIGN']);
    });

    it('answers 400 when the correct sign is not an option', async () => {
      const response = await send('POST', '/v1/admin/lessons/vogais/exercises', {
        ...exercise,
        correctSignId: 'letter-c',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('studies', () => {
    const study = {
      groupId: 'iniciante',
      title: 'Alfabeto',
      description: 'As letras.',
      pages: [{ title: 'A', blocks: [{ type: 'sign', signId: 'letter-a' }] }],
    };
    const groups = async () =>
      AdminStudiesResponse.parse((await send('GET', '/v1/admin/studies')).json()).groups;

    it('creates a group and a study, then reads the study with its copy of the sign', async () => {
      const group = await send('POST', '/v1/admin/study-groups', { title: 'Cotidiano' });
      const created = await send('POST', '/v1/admin/studies', study);
      const { id } = CreatedResponse.parse(created.json());
      const read = await send('GET', `/v1/admin/studies/${id}`);

      expect([group.statusCode, created.statusCode, read.statusCode]).toEqual([201, 201, 200]);
      const block = AdminStudy.parse(read.json()).pages[0]?.blocks[0];
      expect(block).toMatchObject({ type: 'sign', signId: 'letter-a', label: 'A' });
      expect((await groups()).map((item) => [item.title, item.studies.length])).toEqual([
        ['Primeiros passos', 1],
        ['Cotidiano', 0],
      ]);
    });

    it('moves a study, reorders groups and deletes an empty group', async () => {
      const other = CreatedResponse.parse(
        (await send('POST', '/v1/admin/study-groups', { title: 'Outro' })).json(),
      );
      const { id } = CreatedResponse.parse((await send('POST', '/v1/admin/studies', study)).json());

      const moved = await send('PUT', `/v1/admin/studies/${id}`, { ...study, groupId: other.id });
      const reordered = await send('PUT', '/v1/admin/study-groups/order', {
        ids: [other.id, 'iniciante'],
      });
      const renamed = await send('PATCH', '/v1/admin/study-groups/iniciante', { title: 'Início' });
      const notEmpty = await send('DELETE', `/v1/admin/study-groups/${other.id}`);
      const deleted = await send('DELETE', '/v1/admin/study-groups/iniciante');

      expect([moved.statusCode, reordered.statusCode, renamed.statusCode]).toEqual([204, 204, 204]);
      expect([notEmpty.statusCode, errorCode(notEmpty)]).toEqual([409, 'STUDY_GROUP_NOT_EMPTY']);
      expect(deleted.statusCode).toBe(204);
      expect((await groups()).map((item) => item.id)).toEqual([other.id]);
    });

    it('creates a study hidden and shows it', async () => {
      const { id } = CreatedResponse.parse((await send('POST', '/v1/admin/studies', study)).json());
      const read = async () =>
        AdminStudy.parse((await send('GET', `/v1/admin/studies/${id}`)).json()).visible;

      expect(await read()).toBe(false);
      const shown = await send('PUT', `/v1/admin/studies/${id}/visibility`, { visible: true });
      expect(shown.statusCode).toBe(204);
      expect(await read()).toBe(true);
    });

    it('reorders and deletes studies', async () => {
      const first = CreatedResponse.parse((await send('POST', '/v1/admin/studies', study)).json());
      const second = CreatedResponse.parse((await send('POST', '/v1/admin/studies', study)).json());

      const reordered = await send('PUT', '/v1/admin/study-groups/iniciante/studies/order', {
        ids: [second.id, first.id],
      });
      const deleted = await send('DELETE', `/v1/admin/studies/${first.id}`);

      expect([reordered.statusCode, deleted.statusCode]).toEqual([204, 204]);
      expect((await groups())[0]?.studies.map((item) => item.id)).toEqual([second.id]);
    });

    it('answers 422 for an unknown group or sign and 404 for an unknown study', async () => {
      const noGroup = await send('POST', '/v1/admin/studies', { ...study, groupId: 'nope' });
      const noSign = await send('POST', '/v1/admin/studies', {
        ...study,
        pages: [{ title: 'A', blocks: [{ type: 'sign', signId: 'nope' }] }],
      });
      const noStudy = await send('GET', '/v1/admin/studies/nope');

      expect([noGroup.statusCode, errorCode(noGroup)]).toEqual([422, 'UNKNOWN_STUDY_GROUP']);
      expect([noSign.statusCode, errorCode(noSign)]).toEqual([422, 'UNKNOWN_SIGN']);
      expect([noStudy.statusCode, errorCode(noStudy)]).toEqual([404, 'STUDY_NOT_FOUND']);
    });
  });
});
