import { getLesson } from './getLesson';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

async function resolveGetLesson(lessonId: string) {
  const lesson = getLesson(lessonId);
  await jest.runAllTimersAsync();
  return lesson;
}

describe('getLesson', () => {
  it('returns the requested lesson', async () => {
    expect((await resolveGetLesson('saudacoes-bom-dia')).id).toBe('saudacoes-bom-dia');
  });

  it('mixes 6 to 8 sign_to_word and word_to_sign exercises', async () => {
    const { exercises } = await resolveGetLesson('saudacoes-bom-dia');
    const types = new Set(exercises.map((exercise) => exercise.type));

    expect(exercises.length).toBeGreaterThanOrEqual(6);
    expect(exercises.length).toBeLessThanOrEqual(8);
    expect(types).toEqual(new Set(['sign_to_word', 'word_to_sign']));
  });
});
