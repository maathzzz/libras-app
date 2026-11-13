import { z } from 'zod';

import { StudyPage } from './study';

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

// Study groups and studies

// The sections of the "Estudar" tab. Unlike in the app, empty groups are listed too.
export const AdminStudySummary = z.object({
  id: ContentId,
  title: ContentTitle,
  description: z.string().min(1),
  pageCount: z.number().int().nonnegative(),
});
export type AdminStudySummary = z.infer<typeof AdminStudySummary>;

export const AdminStudyGroup = z.object({
  id: ContentId,
  title: ContentTitle,
  studies: z.array(AdminStudySummary),
});
export type AdminStudyGroup = z.infer<typeof AdminStudyGroup>;

// GET /v1/admin/studies — every draft group with its studies, both in order. Groups are
// created with POST /v1/admin/study-groups (SaveTitleRequest), renamed with PATCH and
// deleted with DELETE /v1/admin/study-groups/:groupId (409 STUDY_GROUP_NOT_EMPTY while it
// has studies), reordered with PUT /v1/admin/study-groups/order.
export const AdminStudiesResponse = z.object({ groups: z.array(AdminStudyGroup) });
export type AdminStudiesResponse = z.infer<typeof AdminStudiesResponse>;

// GET /v1/admin/studies/:studyId — a draft study as stored, pages in the format the app
// receives. Sign blocks without `signId` came from before the CMS and must be picked again.
export const AdminStudy = z.object({
  id: ContentId,
  groupId: ContentId,
  title: ContentTitle,
  description: z.string().min(1),
  pages: z.array(StudyPage),
});
export type AdminStudy = z.infer<typeof AdminStudy>;

export const STUDY_MAX_PAGES = 30;
export const STUDY_PAGE_MAX_BLOCKS = 60;

const BlockText = z.string().trim().min(1).max(2000);

// A block as the CMS sends it. A sign block names a draft sign; the BFF copies its label,
// images and description into the page, as it does for exercises.
export const SaveStudyBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('heading'), text: z.string().trim().min(1).max(80) }),
  z.object({ type: z.literal('text'), body: BlockText }),
  z.object({ type: z.literal('sign'), signId: ContentId }),
  z.object({ type: z.literal('tip'), body: BlockText }),
]);
export type SaveStudyBlock = z.infer<typeof SaveStudyBlock>;

export const SaveStudyPage = z.object({
  // Kept for an existing page; a new page has none and the BFF gives it one.
  id: ContentId.optional(),
  title: ContentTitle,
  blocks: z.array(SaveStudyBlock).min(1).max(STUDY_PAGE_MAX_BLOCKS),
});
export type SaveStudyPage = z.infer<typeof SaveStudyPage>;

// POST /v1/admin/studies creates (at the end of its group); PUT /v1/admin/studies/:studyId
// replaces every field. A study moved to another group goes to the end of that group.
// Studies of one group are reordered with PUT /v1/admin/study-groups/:groupId/studies/order.
export const SaveStudyRequest = z
  .object({
    groupId: ContentId,
    title: ContentTitle,
    description: z.string().trim().min(1).max(200),
    pages: z.array(SaveStudyPage).min(1).max(STUDY_MAX_PAGES),
  })
  .superRefine((study, ctx) => {
    const seen = new Set<string>();
    study.pages.forEach((page, index) => {
      if (page.id === undefined) return;
      if (seen.has(page.id)) {
        ctx.addIssue({ code: 'custom', path: ['pages', index, 'id'], message: 'Repeated page' });
      }
      seen.add(page.id);
    });
  });
export type SaveStudyRequest = z.infer<typeof SaveStudyRequest>;
