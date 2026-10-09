import { LessonBundle } from '@libras/contracts';

import { mockLesson } from './lessonMocks';

// Long enough for the loading state to be visible on the device.
const mockLatencyMs = 600;

// Mocked until the BFF exposes GET /v1/lessons/:lessonId. Then only this function changes,
// to `apiRequest(`/v1/lessons/${lessonId}`, LessonBundle)`; meanwhile the mock goes through
// the same schema.
export async function getLesson(lessonId: string): Promise<LessonBundle> {
  await new Promise((resolve) => setTimeout(resolve, mockLatencyMs));
  return LessonBundle.parse(mockLesson(lessonId));
}
