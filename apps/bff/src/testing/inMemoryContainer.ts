import { createLocalJWKSet, type JWTVerifyGetKey } from 'jose';

import type { Container } from '../container';
import { AuthorizeAdmin } from '../modules/admin/application/AuthorizeAdmin';
import { InMemoryAdminRepository } from '../modules/admin/testing/InMemoryAdminRepository';
import { CreateExercise } from '../modules/authoring/application/CreateExercise';
import { CreateOutlineItem } from '../modules/authoring/application/CreateOutlineItem';
import { CreateSign } from '../modules/authoring/application/CreateSign';
import { CreateSignImageUpload } from '../modules/authoring/application/CreateSignImageUpload';
import { DeleteExercise } from '../modules/authoring/application/DeleteExercise';
import { DeleteOutlineItem } from '../modules/authoring/application/DeleteOutlineItem';
import { DeleteSign } from '../modules/authoring/application/DeleteSign';
import { GetDraftSigns } from '../modules/authoring/application/GetDraftSigns';
import { GetDraftTrails } from '../modules/authoring/application/GetDraftTrails';
import { GetLessonExercises } from '../modules/authoring/application/GetLessonExercises';
import { RenameOutlineItem } from '../modules/authoring/application/RenameOutlineItem';
import { ReorderExercises } from '../modules/authoring/application/ReorderExercises';
import { ReorderOutlineItems } from '../modules/authoring/application/ReorderOutlineItems';
import { SetOutlineItemVisibility } from '../modules/authoring/application/SetOutlineItemVisibility';
import { SetStudyVisibility } from '../modules/authoring/application/SetStudyVisibility';
import { UpdateExercise } from '../modules/authoring/application/UpdateExercise';
import { CreateStudy } from '../modules/authoring/application/CreateStudy';
import { CreateStudyGroup } from '../modules/authoring/application/CreateStudyGroup';
import { DeleteStudy } from '../modules/authoring/application/DeleteStudy';
import { DeleteStudyGroup } from '../modules/authoring/application/DeleteStudyGroup';
import { GetDraftStudies } from '../modules/authoring/application/GetDraftStudies';
import { GetDraftStudy } from '../modules/authoring/application/GetDraftStudy';
import { RenameStudyGroup } from '../modules/authoring/application/RenameStudyGroup';
import { ReorderStudies } from '../modules/authoring/application/ReorderStudies';
import { ReorderStudyGroups } from '../modules/authoring/application/ReorderStudyGroups';
import { UpdateStudy } from '../modules/authoring/application/UpdateStudy';
import { UpdateSign } from '../modules/authoring/application/UpdateSign';
import { InMemoryDraftExercises } from '../modules/authoring/testing/InMemoryDraftExercises';
import { InMemoryDraftOutline } from '../modules/authoring/testing/InMemoryDraftOutline';
import { InMemoryDraftStudies } from '../modules/authoring/testing/InMemoryDraftStudies';
import { InMemoryDraftSigns } from '../modules/authoring/testing/InMemoryDraftSigns';
import { InMemorySignImageStorage } from '../modules/authoring/testing/InMemorySignImageStorage';
import { GetStudies } from '../modules/curriculum/application/GetStudies';
import { GetStudy } from '../modules/curriculum/application/GetStudy';
import { InMemoryStudyRepository } from '../modules/curriculum/testing/InMemoryStudyRepository';
import { DeleteAccount } from '../modules/profile/application/DeleteAccount';
import { GetProfile } from '../modules/profile/application/GetProfile';
import { UpdateProfile } from '../modules/profile/application/UpdateProfile';
import { InMemoryAuthAdmin } from '../modules/profile/testing/InMemoryAuthAdmin';
import { InMemoryProfileRepository } from '../modules/profile/testing/InMemoryProfileRepository';
import { CompleteLesson } from '../modules/progress/application/CompleteLesson';
import { GetAchievements } from '../modules/progress/application/GetAchievements';
import { GetHome } from '../modules/progress/application/GetHome';
import { GetLesson } from '../modules/progress/application/GetLesson';
import { InMemoryLessonCatalog } from '../modules/progress/testing/InMemoryLessonCatalog';
import { InMemoryProgressStore } from '../modules/progress/testing/InMemoryProgressStore';
import { InMemoryTrailCatalog } from '../modules/progress/testing/InMemoryTrailCatalog';
import type { Clock } from '../shared/application/Clock';
import { SequentialIdGenerator } from '../shared/application/SequentialIdGenerator';
import { createAccessTokenVerifier } from '../shared/infrastructure/auth';

export const testIssuer = 'https://test.supabase.co/auth/v1';

interface InMemoryContainerOptions {
  // Keys that sign the test tokens. Without them every token is refused.
  jwks?: JWTVerifyGetKey;
  profiles?: InMemoryProfileRepository;
  authAdmin?: InMemoryAuthAdmin;
  progress?: InMemoryProgressStore;
  lessons?: InMemoryLessonCatalog;
  trails?: InMemoryTrailCatalog;
  studies?: InMemoryStudyRepository;
  admins?: InMemoryAdminRepository;
  outline?: InMemoryDraftOutline;
  draftSigns?: InMemoryDraftSigns;
  draftExercises?: InMemoryDraftExercises;
  draftStudies?: InMemoryDraftStudies;
  signImages?: InMemorySignImageStorage;
}

// For tests of the HTTP layer: a Container with in-memory fakes and no database.
export function createInMemoryContainer(
  clock: Clock,
  {
    jwks = createLocalJWKSet({ keys: [] }),
    profiles = new InMemoryProfileRepository(),
    authAdmin = new InMemoryAuthAdmin(),
    progress = new InMemoryProgressStore(),
    lessons = new InMemoryLessonCatalog([]),
    trails = new InMemoryTrailCatalog([]),
    studies = new InMemoryStudyRepository(),
    admins = new InMemoryAdminRepository(),
    outline = new InMemoryDraftOutline(),
    draftSigns = new InMemoryDraftSigns(),
    draftExercises = new InMemoryDraftExercises(),
    draftStudies = new InMemoryDraftStudies(),
    signImages = new InMemorySignImageStorage(),
  }: InMemoryContainerOptions = {},
): Container {
  const ids = new SequentialIdGenerator();
  return {
    clock,
    verifyAccessToken: createAccessTokenVerifier({
      jwks,
      issuer: testIssuer,
      audience: 'authenticated',
      clock,
    }),
    completeLesson: new CompleteLesson(
      progress,
      progress,
      lessons,
      trails,
      progress,
      progress,
      clock,
    ),
    getAchievements: new GetAchievements(trails, progress, progress, progress),
    getStudies: new GetStudies(studies),
    getStudy: new GetStudy(studies),
    authorizeAdmin: new AuthorizeAdmin(admins),
    getDraftTrails: new GetDraftTrails(outline),
    createOutlineItem: new CreateOutlineItem(outline, ids),
    renameOutlineItem: new RenameOutlineItem(outline),
    deleteOutlineItem: new DeleteOutlineItem(outline),
    reorderOutlineItems: new ReorderOutlineItems(outline),
    setOutlineItemVisibility: new SetOutlineItemVisibility(outline),
    getDraftSigns: new GetDraftSigns(draftSigns),
    createSign: new CreateSign(draftSigns, ids),
    updateSign: new UpdateSign(draftSigns),
    deleteSign: new DeleteSign(draftSigns),
    getLessonExercises: new GetLessonExercises(draftExercises),
    createExercise: new CreateExercise(draftExercises, draftSigns, ids),
    updateExercise: new UpdateExercise(draftExercises, draftSigns),
    deleteExercise: new DeleteExercise(draftExercises),
    reorderExercises: new ReorderExercises(draftExercises),
    getDraftStudies: new GetDraftStudies(draftStudies),
    createStudyGroup: new CreateStudyGroup(draftStudies, ids),
    renameStudyGroup: new RenameStudyGroup(draftStudies),
    deleteStudyGroup: new DeleteStudyGroup(draftStudies),
    reorderStudyGroups: new ReorderStudyGroups(draftStudies),
    getDraftStudy: new GetDraftStudy(draftStudies),
    createStudy: new CreateStudy(draftStudies, draftSigns, ids),
    updateStudy: new UpdateStudy(draftStudies, draftSigns, ids),
    deleteStudy: new DeleteStudy(draftStudies),
    reorderStudies: new ReorderStudies(draftStudies),
    setStudyVisibility: new SetStudyVisibility(draftStudies),
    createSignImageUpload: new CreateSignImageUpload(signImages, ids),
    getHome: new GetHome(trails, progress, progress),
    getLesson: new GetLesson(lessons, trails, progress),
    getProfile: new GetProfile(profiles),
    updateProfile: new UpdateProfile(profiles),
    deleteAccount: new DeleteAccount(profiles, authAdmin),
  };
}
