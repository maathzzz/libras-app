import { CompleteLessonRequest } from '@libras/contracts';

import { isRetryableError } from '@/shared/api/client';
import { createOfflineQueue } from '@/shared/lib/offlineQueue';

import { submitSession } from './submitSession';

// Lessons finished without network. The idempotency key lets the BFF ignore a session
// that did arrive the first time but whose response was lost.
export const pendingSessions = createOfflineQueue({
  storageKey: 'lesson.pendingSessions',
  schema: CompleteLessonRequest,
  keyOf: (session) => session.idempotencyKey,
  send: submitSession,
  shouldRetry: isRetryableError,
});
