import { ApiError } from '@/shared/api/client';

import { mockGetStudies, mockGetStudy } from './studyFixtures';

async function resolve<T>(promise: Promise<T>): Promise<T> {
  await jest.runAllTimersAsync();
  return promise;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('mockGetStudies', () => {
  it('lists the alphabet study with its page count', async () => {
    const { groups } = await resolve(mockGetStudies());

    expect(groups).toHaveLength(1);
    expect(groups[0]?.studies).toEqual([
      expect.objectContaining({ id: 'alfabeto-manual', pageCount: 6 }),
    ]);
  });
});

describe('mockGetStudy', () => {
  it('returns the alphabet study with every letter from A to Z', async () => {
    const guide = await resolve(mockGetStudy('alfabeto-manual'));
    const labels = guide.pages
      .flatMap((page) => page.blocks)
      .flatMap((block) => (block.type === 'sign' ? [block.label] : []));

    expect(labels.join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });

  it('shows the letters with movement as two frames, like the seed', async () => {
    const guide = await resolve(mockGetStudy('alfabeto-manual'));
    const twoFrames = guide.pages
      .flatMap((page) => page.blocks)
      .flatMap((block) =>
        block.type === 'sign' && block.images.length === 2 ? [block.label] : [],
      );

    expect(twoFrames.join('')).toBe('HJKXYZ');
  });

  it('rejects an unknown study like the BFF', async () => {
    const study = mockGetStudy('nao-existe');
    const assertion = expect(study).rejects.toEqual(
      expect.objectContaining({ kind: 'request', code: 'STUDY_NOT_FOUND' }),
    );
    await jest.runAllTimersAsync();
    await assertion;
    await expect(study).rejects.toBeInstanceOf(ApiError);
  });
});
