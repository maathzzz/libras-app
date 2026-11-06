import type { StudiesResponse, StudyGuide } from '@libras/contracts';

import { getStudies } from './getStudies';
import { getStudy } from './getStudy';

jest.mock('@/shared/api/session', () => ({ getAccessToken: async () => 'token-1' }));

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

const answer = (status: number, body: unknown) =>
  fetchMock.mockResolvedValue({ ok: status < 400, status, json: async () => body });

const guide: StudyGuide = {
  id: 'alfabeto-manual',
  trailId: 'libras-iniciante',
  title: 'Alfabeto manual',
  description: 'As 26 letras em Libras.',
  pages: [
    {
      id: 'numeros',
      title: 'Números',
      blocks: [
        {
          type: 'sign',
          label: '1',
          images: [{ url: 'https://example.com/1.png', alt: 'Indicador estendido' }],
          description: 'Indicador estendido, demais dedos fechados.',
        },
      ],
    },
  ],
};

describe('getStudies', () => {
  it('reads GET /v1/studies from the BFF', async () => {
    const studies: StudiesResponse = {
      trails: [
        {
          id: 'libras-iniciante',
          title: 'Libras para iniciantes',
          studies: [
            { id: guide.id, title: guide.title, description: guide.description, pageCount: 1 },
          ],
        },
      ],
    };
    answer(200, studies);

    await expect(getStudies()).resolves.toEqual(studies);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://bff.test/v1/studies');
  });
});

describe('getStudy', () => {
  it('reads GET /v1/studies/:studyId, keeping the sign descriptions', async () => {
    answer(200, guide);

    await expect(getStudy('alfabeto-manual')).resolves.toEqual(guide);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://bff.test/v1/studies/alfabeto-manual');
  });

  it('rejects with the BFF code for an unknown study', async () => {
    answer(404, { error: { code: 'STUDY_NOT_FOUND', message: 'Study x not found' } });

    await expect(getStudy('x')).rejects.toEqual(
      expect.objectContaining({ kind: 'request', status: 404, code: 'STUDY_NOT_FOUND' }),
    );
  });
});
