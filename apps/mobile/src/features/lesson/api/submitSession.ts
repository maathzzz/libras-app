import { CompleteLessonRequest, CompleteLessonResponse } from '@libras/contracts';

import { apiRequest } from '@/shared/api/client';
import { mocksEnabled } from '@/shared/api/mockServer';

import { mockSubmitSession } from './lessonFixtures';

// The app keeps the whole request (the offline queue stores it); on the wire, lessonId goes in
// the path and idempotencyKey in the Idempotency-Key header.
export async function submitSession(
  session: CompleteLessonRequest,
): Promise<CompleteLessonResponse> {
  const { lessonId, idempotencyKey, answers, localDate } = CompleteLessonRequest.parse(session);
  if (mocksEnabled) return mockSubmitSession({ lessonId, idempotencyKey, answers, localDate });

  return apiRequest(
    `/v1/lessons/${encodeURIComponent(lessonId)}/sessions`,
    CompleteLessonResponse,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: { answers, localDate },
    },
  );
}
