import { LessonBundle } from '@libras/contracts';

import { apiRequest } from '@/shared/api/client';
import { mocksEnabled } from '@/shared/api/mockServer';

import { mockGetLesson } from './lessonFixtures';

export function getLesson(lessonId: string): Promise<LessonBundle> {
  if (mocksEnabled) return mockGetLesson(lessonId);
  return apiRequest(`/v1/lessons/${encodeURIComponent(lessonId)}`, LessonBundle);
}
