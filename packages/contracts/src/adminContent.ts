import { z } from 'zod';

// CMS content routes (/v1/admin/*). Everything here reads and writes the draft: learners
// only see it after "Publicar alterações". In the interface a unit is a "módulo".

const ContentId = z.string().min(1).max(80);

// Title of a trail, unit or lesson.
export const ContentTitle = z.string().trim().min(1).max(80);

export const AdminLesson = z.object({
  id: ContentId,
  title: ContentTitle,
  exerciseCount: z.number().int().nonnegative(),
});
export type AdminLesson = z.infer<typeof AdminLesson>;

export const AdminUnit = z.object({
  id: ContentId,
  title: ContentTitle,
  lessons: z.array(AdminLesson),
});
export type AdminUnit = z.infer<typeof AdminUnit>;

export const AdminTrail = z.object({
  id: ContentId,
  title: ContentTitle,
  units: z.array(AdminUnit),
});
export type AdminTrail = z.infer<typeof AdminTrail>;

// GET /v1/admin/trails — every draft trail with its units and lessons, each list in order.
export const AdminTrailsResponse = z.object({ trails: z.array(AdminTrail) });
export type AdminTrailsResponse = z.infer<typeof AdminTrailsResponse>;

// POST to create a trail, unit or lesson (added at the end) and PATCH to rename one.
export const SaveTitleRequest = z.object({ title: ContentTitle });
export type SaveTitleRequest = z.infer<typeof SaveTitleRequest>;

// 201 of every POST that creates content.
export const CreatedResponse = z.object({ id: ContentId });
export type CreatedResponse = z.infer<typeof CreatedResponse>;

// PUT .../order — the new order of all the items of one list. Anything other than exactly
// the current items is refused with 422 INVALID_ORDER.
export const ReorderRequest = z.object({
  ids: z
    .array(ContentId)
    .min(1)
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Repeated id' }),
});
export type ReorderRequest = z.infer<typeof ReorderRequest>;

// Signs

// The `signs` bucket accepts only these types, up to 1 MB per file.
export const SignImageContentType = z.enum(['image/webp', 'image/png', 'image/jpeg']);
export type SignImageContentType = z.infer<typeof SignImageContentType>;
export const SIGN_IMAGE_MAX_BYTES = 1024 * 1024;
export const SIGN_MAX_IMAGES = 8;

const SignFields = {
  label: z.string().trim().min(1).max(40),
  // In order: a sign with movement has one image per frame.
  imageUrls: z.array(z.string().min(1)).min(1).max(SIGN_MAX_IMAGES),
  // Read by screen readers. Describes the hand, never the answer of an exercise.
  alt: z.string().trim().min(1).max(200),
  // Visible text on how to perform the sign; null while nobody has written it.
  description: z.string().trim().min(1).max(500).nullable(),
};

export const AdminSign = z.object({
  id: ContentId,
  ...SignFields,
  // Draft exercises that show the sign. A sign in use cannot be deleted.
  exerciseCount: z.number().int().nonnegative(),
});
export type AdminSign = z.infer<typeof AdminSign>;

// GET /v1/admin/signs — every draft sign, by label.
export const AdminSignsResponse = z.object({ signs: z.array(AdminSign) });
export type AdminSignsResponse = z.infer<typeof AdminSignsResponse>;

// POST /v1/admin/signs creates; PUT /v1/admin/signs/:signId replaces every field.
export const SaveSignRequest = z.object(SignFields);
export type SaveSignRequest = z.infer<typeof SaveSignRequest>;

// POST /v1/admin/signs/uploads — where to send one image. The CMS sends the file with
// `PUT uploadUrl` (header content-type) and then saves `imageUrl` in the sign. The URL is
// single-use and short-lived, and every upload gets a new path.
export const CreateSignImageUploadRequest = z.object({ contentType: SignImageContentType });
export type CreateSignImageUploadRequest = z.infer<typeof CreateSignImageUploadRequest>;

export const SignImageUploadResponse = z.object({
  uploadUrl: z.url(),
  imageUrl: z.url(),
});
export type SignImageUploadResponse = z.infer<typeof SignImageUploadResponse>;

// Exercises

// The exercise types the CMS edits. Both show signs from the draft as options: sign_to_word
// shows the correct sign and asks for its label; word_to_sign shows the label and asks for
// the sign.
export const AdminExerciseType = z.enum(['sign_to_word', 'word_to_sign']);
export type AdminExerciseType = z.infer<typeof AdminExerciseType>;

// The app lays the options out in a 2 × 2 grid.
export const EXERCISE_MIN_OPTIONS = 2;
export const EXERCISE_MAX_OPTIONS = 4;

const ExerciseFields = {
  type: AdminExerciseType,
  // Draft signs shown as the options, in the order the learner sees them.
  signIds: z
    .array(ContentId)
    .min(EXERCISE_MIN_OPTIONS)
    .max(EXERCISE_MAX_OPTIONS)
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Repeated sign' }),
  // One of `signIds`: the right answer.
  correctSignId: ContentId,
};

function ensureCorrectSignIsAnOption(
  exercise: { signIds: string[]; correctSignId: string },
  ctx: z.RefinementCtx,
): void {
  if (exercise.signIds.includes(exercise.correctSignId)) return;
  ctx.addIssue({
    code: 'custom',
    path: ['correctSignId'],
    message: 'correctSignId must be one of signIds',
  });
}

export const AdminExercise = z
  .object({ id: ContentId, ...ExerciseFields })
  .superRefine(ensureCorrectSignIsAnOption);
export type AdminExercise = z.infer<typeof AdminExercise>;

// GET /v1/admin/lessons/:lessonId/exercises — the draft lesson and its exercises in order.
export const AdminLessonExercisesResponse = z.object({
  lesson: z.object({ id: ContentId, title: ContentTitle }),
  exercises: z.array(AdminExercise),
});
export type AdminLessonExercisesResponse = z.infer<typeof AdminLessonExercisesResponse>;

// POST /v1/admin/lessons/:lessonId/exercises creates (at the end of the lesson); PUT
// /v1/admin/exercises/:exerciseId replaces every field. The BFF copies the label and the
// images of each sign into the exercise, as the app receives it.
export const SaveExerciseRequest = z
  .object(ExerciseFields)
  .superRefine(ensureCorrectSignIsAnOption);
export type SaveExerciseRequest = z.infer<typeof SaveExerciseRequest>;
