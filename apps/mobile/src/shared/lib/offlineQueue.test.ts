import { z } from 'zod';

import { ApiError, isRetryableError } from '../api/client';
import { createOfflineQueue } from './offlineQueue';
import { storage } from './storage';

const SessionSchema = z.object({ key: z.string(), score: z.number() });
type Session = z.infer<typeof SessionSchema>;

const storageKey = 'test.sessions';
const networkError = () => new ApiError('network', 'Sem resposta');
const send = jest.fn<Promise<unknown>, [Session]>();

function makeQueue() {
  return createOfflineQueue({
    storageKey,
    schema: SessionSchema,
    keyOf: (session) => session.key,
    send,
    shouldRetry: isRetryableError,
  });
}

const a: Session = { key: 'a', score: 1 };
const b: Session = { key: 'b', score: 2 };

beforeEach(() => {
  storage.clearAll();
  send.mockReset().mockResolvedValue(undefined);
});

describe('enqueue', () => {
  it('keeps the item in MMKV, so it survives an app restart', () => {
    makeQueue().enqueue(a);

    expect(makeQueue().pending()).toEqual([a]);
  });

  it('does not add an item whose key is already queued', () => {
    const queue = makeQueue();

    expect(queue.enqueue(a)).toBe(true);
    expect(queue.enqueue({ ...a, score: 99 })).toBe(false);

    expect(queue.pending()).toEqual([a]);
  });

  it('starts empty when the stored content is unreadable', () => {
    storage.set(storageKey, '{not json');
    expect(makeQueue().pending()).toEqual([]);

    storage.set(storageKey, JSON.stringify([{ key: 1 }]));
    expect(makeQueue().pending()).toEqual([]);
  });
});

describe('flush', () => {
  it('sends the queued items in order and empties the queue', async () => {
    const queue = makeQueue();
    queue.enqueue(a);
    queue.enqueue(b);

    await expect(queue.flush()).resolves.toEqual({ sent: 2 });

    expect(send.mock.calls).toEqual([[a], [b]]);
    expect(queue.pending()).toEqual([]);
    expect(storage.getString(storageKey)).toBeUndefined();
  });

  it('keeps the items and stops when there is still no network', async () => {
    const queue = makeQueue();
    queue.enqueue(a);
    queue.enqueue(b);
    send.mockRejectedValueOnce(networkError());

    await expect(queue.flush()).resolves.toEqual({ sent: 0 });

    expect(send).toHaveBeenCalledTimes(1);
    expect(queue.pending()).toEqual([a, b]);
  });

  it('sends again on a later flush once the network is back', async () => {
    const queue = makeQueue();
    queue.enqueue(a);
    send.mockRejectedValueOnce(networkError());
    await queue.flush();

    await expect(queue.flush()).resolves.toEqual({ sent: 1 });

    expect(send).toHaveBeenCalledTimes(2);
    expect(queue.pending()).toEqual([]);
  });

  it('drops an item the server refused and goes on with the next one', async () => {
    const queue = makeQueue();
    queue.enqueue(a);
    queue.enqueue(b);
    send.mockRejectedValueOnce(new ApiError('request', 'recusada', 400, 'VALIDATION_ERROR'));

    await expect(queue.flush()).resolves.toEqual({ sent: 1 });

    expect(send.mock.calls).toEqual([[a], [b]]);
    expect(queue.pending()).toEqual([]);
  });

  it('sends a key enqueued twice only once', async () => {
    const queue = makeQueue();
    queue.enqueue(a);
    queue.enqueue(a);

    await queue.flush();

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('does not send the same item twice when flushes overlap', async () => {
    let finishSend = () => {};
    send.mockReturnValueOnce(new Promise<void>((resolve) => (finishSend = resolve)));
    const queue = makeQueue();
    queue.enqueue(a);

    // App opening and coming to the foreground at the same time, for example.
    const first = queue.flush();
    const second = queue.flush();
    finishSend();
    await Promise.all([first, second]);

    expect(send).toHaveBeenCalledTimes(1);
    expect(queue.pending()).toEqual([]);
  });

  it('keeps an item enqueued while another one was being sent', async () => {
    let finishSend = () => {};
    send.mockReturnValueOnce(new Promise<void>((resolve) => (finishSend = resolve)));
    const queue = makeQueue();
    queue.enqueue(a);

    const flushing = queue.flush();
    queue.enqueue(b);
    finishSend();
    await flushing;

    expect(queue.pending()).toEqual([b]);
  });
});
