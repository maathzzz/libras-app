import {
  AdminLessonExercisesResponse,
  CreatedResponse,
  type SaveExerciseRequest,
} from '@libras/contracts';

import { apiRequest, NoContent } from '@/shared/api/client';

const lessonPath = (lessonId: string) =>
  `/v1/admin/lessons/${encodeURIComponent(lessonId)}/exercises`;
const exercisePath = (id: string) => `/v1/admin/exercises/${encodeURIComponent(id)}`;

export async function getLessonExercises(lessonId: string): Promise<AdminLessonExercisesResponse> {
  return apiRequest(lessonPath(lessonId), AdminLessonExercisesResponse);
}

export async function createExercise(
  lessonId: string,
  exercise: SaveExerciseRequest,
): Promise<string> {
  const { id } = await apiRequest(lessonPath(lessonId), CreatedResponse, {
    method: 'POST',
    body: exercise,
  });
  return id;
}

export async function updateExercise(id: string, exercise: SaveExerciseRequest): Promise<void> {
  await apiRequest(exercisePath(id), NoContent, { method: 'PUT', body: exercise });
}

export async function deleteExercise(id: string): Promise<void> {
  await apiRequest(exercisePath(id), NoContent, { method: 'DELETE' });
}

export async function reorderExercises(lessonId: string, ids: readonly string[]): Promise<void> {
  await apiRequest(`${lessonPath(lessonId)}/order`, NoContent, { method: 'PUT', body: { ids } });
}
