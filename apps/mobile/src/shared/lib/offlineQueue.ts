import { z } from 'zod';

import { storage } from './storage';

type OfflineQueueOptions<TSchema extends z.ZodType> = {
  /** MMKV key where the pending items are kept. */
  storageKey: string;
  /** Validates what is read back from storage; it may come from an older app version. */
  schema: TSchema;
  /** Identifies an item; an item whose key is already queued is not added again. */
  keyOf: (item: z.infer<TSchema>) => string;
  send: (item: z.infer<TSchema>) => Promise<unknown>;
  /** True when sending again later may work (e.g. no network). Other failures drop the item. */
  shouldRetry: (error: unknown) => boolean;
};

export type OfflineQueue<TItem> = {
  enqueue: (item: TItem) => boolean;
  pending: () => TItem[];
  flush: () => Promise<{ sent: number }>;
};

// Writes that failed for lack of network, kept in MMKV so they survive the app being
// closed and are sent again later. Items should carry an idempotency key: an item whose
// response was lost is sent twice, and the server must process it once.
export function createOfflineQueue<TSchema extends z.ZodType>({
  storageKey,
  schema,
  keyOf,
  send,
  shouldRetry,
}: OfflineQueueOptions<TSchema>): OfflineQueue<z.infer<TSchema>> {
  type Item = z.infer<TSchema>;
  const listSchema = z.array(schema);
  let flushing: Promise<{ sent: number }> | null = null;

  const read = (): Item[] => {
    const raw = storage.getString(storageKey);
    if (!raw) return [];

    try {
      const parsed = listSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  };

  const write = (items: Item[]) => {
    if (items.length === 0) {
      storage.remove(storageKey);
      return;
    }
    storage.set(storageKey, JSON.stringify(items));
  };

  // Re-reads storage so an item enqueued while another one was being sent is kept.
  const remove = (key: string) => write(read().filter((item) => keyOf(item) !== key));

  const enqueue = (item: Item) => {
    const items = read();
    if (items.some((queued) => keyOf(queued) === keyOf(item))) return false;

    write([...items, item]);
    return true;
  };

  const sendAll = async () => {
    let sent = 0;
    for (const item of read()) {
      try {
        await send(item);
        sent += 1;
      } catch (error) {
        // Without network the next items would fail too; they wait for the next flush.
        if (shouldRetry(error)) break;
      }
      remove(keyOf(item));
    }
    return { sent };
  };

  // Concurrent calls share the same run, so no item is sent twice at the same time.
  const flush = () => {
    flushing ??= sendAll().finally(() => {
      flushing = null;
    });
    return flushing;
  };

  return { enqueue, pending: read, flush };
}
