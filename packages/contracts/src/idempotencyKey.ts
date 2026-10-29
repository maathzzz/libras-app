import { z } from 'zod';

// Sent in the Idempotency-Key header of sensitive writes. The app generates it once (e.g. when
// a lesson starts), so every retry of the same write carries the same key.
export const IdempotencyKey = z.uuid();
export type IdempotencyKey = z.infer<typeof IdempotencyKey>;
