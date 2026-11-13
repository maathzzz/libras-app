import {
  AdminLessonExercisesResponse,
  AdminSignsResponse,
  AdminStudiesResponse,
  AdminStudy,
  AdminTrailsResponse,
  CreatedResponse,
  CreateSignImageUploadRequest,
  ErrorResponse,
  ReorderRequest,
  SaveExerciseRequest,
  SaveSignRequest,
  SaveStudyRequest,
  SaveTitleRequest,
  SetVisibilityRequest,
  SignImageUploadResponse,
} from '@libras/contracts';
import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { DomainError } from '../../../shared/domain/DomainError';
import type { Result } from '../../../shared/domain/Result';
import { errorBody } from '../../../shared/infrastructure/errorHandler';
import type { CreateExercise } from '../application/CreateExercise';
import type { CreateOutlineItem } from '../application/CreateOutlineItem';
import type { CreateSign } from '../application/CreateSign';
import type { CreateSignImageUpload } from '../application/CreateSignImageUpload';
import type { DeleteExercise } from '../application/DeleteExercise';
import type { DeleteOutlineItem } from '../application/DeleteOutlineItem';
import type { DeleteSign } from '../application/DeleteSign';
import type { GetDraftSigns } from '../application/GetDraftSigns';
import type { GetDraftTrails } from '../application/GetDraftTrails';
import type { GetLessonExercises } from '../application/GetLessonExercises';
import type { RenameOutlineItem } from '../application/RenameOutlineItem';
import type { ReorderExercises } from '../application/ReorderExercises';
import type { ReorderOutlineItems } from '../application/ReorderOutlineItems';
import type { SetOutlineItemVisibility } from '../application/SetOutlineItemVisibility';
import type { SetStudyVisibility } from '../application/SetStudyVisibility';
import type { UpdateExercise } from '../application/UpdateExercise';
import type { UpdateSign } from '../application/UpdateSign';
import type { CreateStudy } from '../application/CreateStudy';
import type { CreateStudyGroup } from '../application/CreateStudyGroup';
import type { DeleteStudy } from '../application/DeleteStudy';
import type { DeleteStudyGroup } from '../application/DeleteStudyGroup';
import type { GetDraftStudies } from '../application/GetDraftStudies';
import type { GetDraftStudy } from '../application/GetDraftStudy';
import type { RenameStudyGroup } from '../application/RenameStudyGroup';
import type { ReorderStudies } from '../application/ReorderStudies';
import type { ReorderStudyGroups } from '../application/ReorderStudyGroups';
import type { UpdateStudy } from '../application/UpdateStudy';
import type { OutlineLevel } from '../domain/DraftOutline';

export interface AuthoringUseCases {
  getDraftTrails: GetDraftTrails;
  createOutlineItem: CreateOutlineItem;
  renameOutlineItem: RenameOutlineItem;
  deleteOutlineItem: DeleteOutlineItem;
  reorderOutlineItems: ReorderOutlineItems;
  setOutlineItemVisibility: SetOutlineItemVisibility;
  getDraftSigns: GetDraftSigns;
  createSign: CreateSign;
  updateSign: UpdateSign;
  deleteSign: DeleteSign;
  createSignImageUpload: CreateSignImageUpload;
  getLessonExercises: GetLessonExercises;
  createExercise: CreateExercise;
  updateExercise: UpdateExercise;
  deleteExercise: DeleteExercise;
  reorderExercises: ReorderExercises;
  getDraftStudies: GetDraftStudies;
  createStudyGroup: CreateStudyGroup;
  renameStudyGroup: RenameStudyGroup;
  deleteStudyGroup: DeleteStudyGroup;
  reorderStudyGroups: ReorderStudyGroups;
  getDraftStudy: GetDraftStudy;
  createStudy: CreateStudy;
  updateStudy: UpdateStudy;
  deleteStudy: DeleteStudy;
  reorderStudies: ReorderStudies;
  setStudyVisibility: SetStudyVisibility;
}

function statusOf(code: string): 404 | 409 | 422 {
  if (code.endsWith('_NOT_FOUND')) return 404;
  if (['SIGN_IN_USE', 'STUDY_GROUP_NOT_EMPTY', 'CONTENT_HAS_PROGRESS'].includes(code)) return 409;
  return 422;
}

function sendError(reply: FastifyReply, { code, message }: DomainError) {
  return reply.status(statusOf(code)).send(errorBody(code, message));
}

// Writes answer 204, or the error of the use case.
function sendEmpty(reply: FastifyReply, result: Result<void>) {
  return result.ok ? reply.status(204).send() : sendError(reply, result.error);
}

const errors = { 404: ErrorResponse, 409: ErrorResponse, 422: ErrorResponse };
const idParams = (name: string) => z.object({ [name]: z.string().min(1).max(80) });

// The URL segment and route parameter of each level. Units are "modules" only in the CMS
// interface; the API keeps the name used everywhere else in the code.
const outlineRoutes: Record<OutlineLevel, { path: string; param: string }> = {
  trail: { path: 'trails', param: 'trailId' },
  unit: { path: 'units', param: 'unitId' },
  lesson: { path: 'lessons', param: 'lessonId' },
};

// Draft content for the CMS. Registered inside adminRoutes, so every route here already
// belongs to an active operator. All of it edits the draft; nothing reaches learners
// before a publish.
export function authoringRoutes(useCases: AuthoringUseCases): FastifyPluginAsyncZod {
  const { getDraftTrails, createOutlineItem, renameOutlineItem, deleteOutlineItem } = useCases;
  const { reorderOutlineItems, getDraftSigns, createSign, updateSign, deleteSign } = useCases;
  const { createSignImageUpload, getLessonExercises, createExercise, updateExercise } = useCases;
  const { deleteExercise, reorderExercises } = useCases;
  const { getDraftStudies, createStudyGroup, renameStudyGroup, deleteStudyGroup } = useCases;
  const { reorderStudyGroups, getDraftStudy, createStudy, updateStudy, deleteStudy } = useCases;
  const { reorderStudies, setOutlineItemVisibility, setStudyVisibility } = useCases;

  return async (app) => {
    app.get('/trails', { schema: { response: { 200: AdminTrailsResponse } } }, async () =>
      getDraftTrails.execute(),
    );

    app.post(
      '/trails',
      { schema: { body: SaveTitleRequest, response: { 201: CreatedResponse } } },
      async (request, reply) => {
        const result = await createOutlineItem.execute({ level: 'trail', ...request.body });
        if (!result.ok) return sendError(reply, result.error);
        return reply.status(201).send(result.value);
      },
    );

    app.put(
      '/trails/order',
      { schema: { body: ReorderRequest, response: errors } },
      async (request, reply) =>
        sendEmpty(reply, await reorderOutlineItems.execute({ level: 'trail', ...request.body })),
    );

    // Units of a trail and lessons of a unit: create at the end, and reorder.
    const children = [
      { parent: 'trail', child: 'unit' },
      { parent: 'unit', child: 'lesson' },
    ] as const;
    for (const { parent, child } of children) {
      const { path, param } = outlineRoutes[parent];
      const childPath = outlineRoutes[child].path;
      const params = idParams(param);
      const parentIdOf = (values: Record<string, string>) => values[param] ?? '';

      app.post(
        `/${path}/:${param}/${childPath}`,
        {
          schema: { params, body: SaveTitleRequest, response: { 201: CreatedResponse, ...errors } },
        },
        async (request, reply) => {
          const result = await createOutlineItem.execute({
            level: child,
            parentId: parentIdOf(request.params),
            ...request.body,
          });
          if (!result.ok) return sendError(reply, result.error);
          return reply.status(201).send(result.value);
        },
      );

      app.put(
        `/${path}/:${param}/${childPath}/order`,
        { schema: { params, body: ReorderRequest, response: errors } },
        async (request, reply) =>
          sendEmpty(
            reply,
            await reorderOutlineItems.execute({
              level: child,
              parentId: parentIdOf(request.params),
              ...request.body,
            }),
          ),
      );
    }

    // Rename and delete, the same for the three levels.
    for (const [level, { path, param }] of Object.entries(outlineRoutes) as [
      OutlineLevel,
      (typeof outlineRoutes)[OutlineLevel],
    ][]) {
      const params = idParams(param);
      const idOf = (values: Record<string, string>) => values[param] ?? '';

      app.patch(
        `/${path}/:${param}`,
        { schema: { params, body: SaveTitleRequest, response: errors } },
        async (request, reply) =>
          sendEmpty(
            reply,
            await renameOutlineItem.execute({
              level,
              id: idOf(request.params),
              title: request.body.title,
            }),
          ),
      );

      app.put(
        `/${path}/:${param}/visibility`,
        { schema: { params, body: SetVisibilityRequest, response: errors } },
        async (request, reply) =>
          sendEmpty(
            reply,
            await setOutlineItemVisibility.execute({
              level,
              id: idOf(request.params),
              visible: request.body.visible,
            }),
          ),
      );

      app.delete(
        `/${path}/:${param}`,
        { schema: { params, response: errors } },
        async (request, reply) =>
          sendEmpty(reply, await deleteOutlineItem.execute({ level, id: idOf(request.params) })),
      );
    }

    // Signs

    const signParams = z.object({ signId: z.string().min(1).max(80) });

    app.get('/signs', { schema: { response: { 200: AdminSignsResponse } } }, async () =>
      getDraftSigns.execute(),
    );

    app.post(
      '/signs',
      { schema: { body: SaveSignRequest, response: { 201: CreatedResponse } } },
      async (request, reply) => reply.status(201).send(await createSign.execute(request.body)),
    );

    app.post(
      '/signs/uploads',
      {
        schema: { body: CreateSignImageUploadRequest, response: { 200: SignImageUploadResponse } },
      },
      async (request) => createSignImageUpload.execute(request.body),
    );

    app.put(
      '/signs/:signId',
      { schema: { params: signParams, body: SaveSignRequest, response: errors } },
      async (request, reply) =>
        sendEmpty(reply, await updateSign.execute({ id: request.params.signId, ...request.body })),
    );

    app.delete(
      '/signs/:signId',
      { schema: { params: signParams, response: errors } },
      async (request, reply) =>
        sendEmpty(reply, await deleteSign.execute({ id: request.params.signId })),
    );

    // Exercises

    const lessonParams = idParams('lessonId');
    const exerciseParams = z.object({ exerciseId: z.string().min(1).max(80) });
    const lessonIdOf = (values: Record<string, string>) => values.lessonId ?? '';

    app.get(
      '/lessons/:lessonId/exercises',
      {
        schema: {
          params: lessonParams,
          response: { 200: AdminLessonExercisesResponse, ...errors },
        },
      },
      async (request, reply) => {
        const result = await getLessonExercises.execute({ lessonId: lessonIdOf(request.params) });
        return result.ok ? result.value : sendError(reply, result.error);
      },
    );

    app.post(
      '/lessons/:lessonId/exercises',
      {
        schema: {
          params: lessonParams,
          body: SaveExerciseRequest,
          response: { 201: CreatedResponse, ...errors },
        },
      },
      async (request, reply) => {
        const result = await createExercise.execute({
          lessonId: lessonIdOf(request.params),
          ...request.body,
        });
        if (!result.ok) return sendError(reply, result.error);
        return reply.status(201).send(result.value);
      },
    );

    app.put(
      '/lessons/:lessonId/exercises/order',
      { schema: { params: lessonParams, body: ReorderRequest, response: errors } },
      async (request, reply) =>
        sendEmpty(
          reply,
          await reorderExercises.execute({ lessonId: lessonIdOf(request.params), ...request.body }),
        ),
    );

    app.put(
      '/exercises/:exerciseId',
      { schema: { params: exerciseParams, body: SaveExerciseRequest, response: errors } },
      async (request, reply) =>
        sendEmpty(
          reply,
          await updateExercise.execute({ id: request.params.exerciseId, ...request.body }),
        ),
    );

    app.delete(
      '/exercises/:exerciseId',
      { schema: { params: exerciseParams, response: errors } },
      async (request, reply) =>
        sendEmpty(reply, await deleteExercise.execute({ id: request.params.exerciseId })),
    );

    // Study groups and studies

    const groupParams = idParams('groupId');
    const studyParams = idParams('studyId');
    const groupIdOf = (values: Record<string, string>) => values.groupId ?? '';
    const studyIdOf = (values: Record<string, string>) => values.studyId ?? '';

    app.get('/studies', { schema: { response: { 200: AdminStudiesResponse } } }, async () =>
      getDraftStudies.execute(),
    );

    app.post(
      '/study-groups',
      { schema: { body: SaveTitleRequest, response: { 201: CreatedResponse } } },
      async (request, reply) =>
        reply.status(201).send(await createStudyGroup.execute(request.body)),
    );

    app.put(
      '/study-groups/order',
      { schema: { body: ReorderRequest, response: errors } },
      async (request, reply) => sendEmpty(reply, await reorderStudyGroups.execute(request.body)),
    );

    app.patch(
      '/study-groups/:groupId',
      { schema: { params: groupParams, body: SaveTitleRequest, response: errors } },
      async (request, reply) =>
        sendEmpty(
          reply,
          await renameStudyGroup.execute({ id: groupIdOf(request.params), ...request.body }),
        ),
    );

    app.delete(
      '/study-groups/:groupId',
      { schema: { params: groupParams, response: errors } },
      async (request, reply) =>
        sendEmpty(reply, await deleteStudyGroup.execute({ id: groupIdOf(request.params) })),
    );

    app.put(
      '/study-groups/:groupId/studies/order',
      { schema: { params: groupParams, body: ReorderRequest, response: errors } },
      async (request, reply) =>
        sendEmpty(
          reply,
          await reorderStudies.execute({ groupId: groupIdOf(request.params), ...request.body }),
        ),
    );

    app.post(
      '/studies',
      { schema: { body: SaveStudyRequest, response: { 201: CreatedResponse, ...errors } } },
      async (request, reply) => {
        const result = await createStudy.execute(request.body);
        if (!result.ok) return sendError(reply, result.error);
        return reply.status(201).send(result.value);
      },
    );

    app.get(
      '/studies/:studyId',
      { schema: { params: studyParams, response: { 200: AdminStudy, ...errors } } },
      async (request, reply) => {
        const result = await getDraftStudy.execute({ id: studyIdOf(request.params) });
        return result.ok ? result.value : sendError(reply, result.error);
      },
    );

    app.put(
      '/studies/:studyId',
      { schema: { params: studyParams, body: SaveStudyRequest, response: errors } },
      async (request, reply) =>
        sendEmpty(
          reply,
          await updateStudy.execute({ id: studyIdOf(request.params), ...request.body }),
        ),
    );

    app.put(
      '/studies/:studyId/visibility',
      { schema: { params: studyParams, body: SetVisibilityRequest, response: errors } },
      async (request, reply) =>
        sendEmpty(
          reply,
          await setStudyVisibility.execute({
            id: studyIdOf(request.params),
            visible: request.body.visible,
          }),
        ),
    );

    app.delete(
      '/studies/:studyId',
      { schema: { params: studyParams, response: errors } },
      async (request, reply) =>
        sendEmpty(reply, await deleteStudy.execute({ id: studyIdOf(request.params) })),
    );
  };
}
