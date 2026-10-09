import { Image } from 'expo-image';

import { prefetchImages } from './prefetchImages';

jest.mock('expo-image', () => ({ Image: { prefetch: jest.fn() } }));

const prefetchMock = jest.mocked(Image.prefetch);

beforeEach(() => {
  jest.useFakeTimers();
  prefetchMock.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('prefetchImages', () => {
  it('prefetches each url once into memory and disk', async () => {
    prefetchMock.mockResolvedValue(true);

    await prefetchImages(['a.png', 'b.png', 'a.png'], 1000);

    expect(prefetchMock).toHaveBeenCalledWith(['a.png', 'b.png'], 'memory-disk');
  });

  it('skips the call when there is nothing to prefetch', async () => {
    await prefetchImages([], 1000);

    expect(prefetchMock).not.toHaveBeenCalled();
  });

  it('resolves when a prefetch fails', async () => {
    prefetchMock.mockRejectedValue(new Error('offline'));

    await expect(prefetchImages(['a.png'], 1000)).resolves.toBeUndefined();
  });

  it('gives up after the timeout when the prefetch never settles', async () => {
    prefetchMock.mockReturnValue(new Promise<boolean>(() => {}));
    const onDone = jest.fn();

    void prefetchImages(['a.png'], 1000).then(onDone);
    await jest.advanceTimersByTimeAsync(999);
    expect(onDone).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
