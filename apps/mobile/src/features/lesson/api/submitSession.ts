import { CompleteLessonRequest, CompleteLessonResponse } from '@libras/contracts';

import { recordMockCompletion } from '@/shared/api/mockServer';

import { gradeAnswer } from '../exercises/grading';
import { mockLesson } from './lessonMocks';

// Long enough for the "saving" state to be visible on the device.
const mockLatencyMs = 600;
// Same rule the BFF applies (CLAUDE.md, "Regras de domínio" > XP).
const xpPerLesson = 10;
const perfectLessonBonusXp = 5;

type SimulatedNetwork = 'online' | 'firstAttemptFails' | 'offline';

// To see the offline queue on the device, use 'firstAttemptFails': the lesson is queued
// and sent again when the app comes back to the foreground. 'offline' never sends.
let simulatedNetwork: SimulatedNetwork = 'online';
const attemptedKeys = new Set<string>();

export function simulateNetwork(network: SimulatedNetwork): void {
  simulatedNetwork = network;
  attemptedKeys.clear();
}

function failsNow(idempotencyKey: string): boolean {
  if (simulatedNetwork === 'offline') return true;
  if (simulatedNetwork === 'online') return false;

  const firstAttempt = !attemptedKeys.has(idempotencyKey);
  attemptedKeys.add(idempotencyKey);
  return firstAttempt;
}

// The BFF re-grades every answer: the app's own grading is only for instant feedback.
function isPerfectLesson({ lessonId, answers }: CompleteLessonRequest): boolean {
  const exercises = new Map(mockLesson(lessonId).exercises.map((ex) => [ex.id, ex]));
  return answers.every(({ exerciseId, answer }) => {
    const exercise = exercises.get(exerciseId);
    return exercise !== undefined && gradeAnswer(exercise, answer);
  });
}

// Mocked until the app calls POST /v1/lessons/:lessonId/sessions. Then only this
// function changes, to:
//   apiRequest(`/v1/lessons/${lessonId}/sessions`, CompleteLessonResponse, {
//     method: 'POST', headers: { 'Idempotency-Key': idempotencyKey },
//     body: { answers, localDate },
//   })
export async function submitSession(
  session: CompleteLessonRequest,
): Promise<CompleteLessonResponse> {
  const request = CompleteLessonRequest.parse(session);
  await new Promise((resolve) => setTimeout(resolve, mockLatencyMs));

  // Same error fetch throws in React Native when there is no connection.
  if (failsNow(request.idempotencyKey)) throw new TypeError('Network request failed');

  const xpEarned = xpPerLesson + (isPerfectLesson(request) ? perfectLessonBonusXp : 0);
  return CompleteLessonResponse.parse(recordMockCompletion(request.idempotencyKey, xpEarned));
}
