import { getStudies } from './getStudies';
import { getStudy } from './getStudy';

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

describe('getStudies', () => {
  it('lists the alphabet study with its page count', async () => {
    const { trails } = await resolve(getStudies());

    expect(trails).toHaveLength(1);
    expect(trails[0]?.studies).toEqual([
      expect.objectContaining({ id: 'alfabeto-manual', pageCount: 6 }),
    ]);
  });
});

describe('getStudy', () => {
  it('returns the alphabet study with every letter from A to Z', async () => {
    const guide = await resolve(getStudy('alfabeto-manual'));
    const labels = guide.pages
      .flatMap((page) => page.blocks)
      .flatMap((block) => (block.type === 'sign' ? [block.label] : []));

    expect(labels.join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });

  it('rejects an unknown study', async () => {
    const study = getStudy('nao-existe');
    const assertion = expect(study).rejects.toThrow('Study not found');
    await jest.runAllTimersAsync();
    await assertion;
  });
});
