import { createLocalJWKSet, type JWTVerifyGetKey } from 'jose';

import type { Container } from '../container';
import { CreateOperator } from '../modules/admin/application/CreateOperator';
import { GetOperators } from '../modules/admin/application/GetOperators';
import { ResetOperatorPassword } from '../modules/admin/application/ResetOperatorPassword';
import { UpdateOperator } from '../modules/admin/application/UpdateOperator';
import { AuthorizeAdmin } from '../modules/admin/application/AuthorizeAdmin';
import {
  InMemoryOperatorAccounts,
  SequentialPasswordGenerator,
} from '../modules/admin/testing/InMemoryOperatorAccounts';
import { InMemoryAdminRepository } from '../modules/admin/testing/InMemoryAdminRepository';
import { CreateExercise } from '../modules/authoring/application/CreateExercise';
import { CreateOutlineItem } from '../modules/authoring/application/CreateOutlineItem';
import { CreateSign } from '../modules/authoring/application/CreateSign';
import { CreateSignImageUpload } from '../modules/authoring/application/CreateSignImageUpload';
import { DeleteExercise } from '../modules/authoring/application/DeleteExercise';
import { DeleteOutlineItem } from '../modules/authoring/application/DeleteOutlineItem';
import { DeleteSign } from '../modules/authoring/application/DeleteSign';
import { GetCmsSigns } from '../modules/authoring/application/GetCmsSigns';
import { GetCmsTrails } from '../modules/authoring/application/GetCmsTrails';
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
import { GetCmsStudies } from '../modules/authoring/application/GetCmsStudies';
import { GetCmsStudy } from '../modules/authoring/application/GetCmsStudy';
import { RenameStudyGroup } from '../modules/authoring/application/RenameStudyGroup';
import { ReorderStudies } from '../modules/authoring/application/ReorderStudies';
import { ReorderStudyGroups } from '../modules/authoring/application/ReorderStudyGroups';
import { UpdateStudy } from '../modules/authoring/application/UpdateStudy';
import { UpdateSign } from '../modules/authoring/application/UpdateSign';
import { InMemoryCmsExercises } from '../modules/authoring/testing/InMemoryCmsExercises';
import { InMemoryCmsOutline } from '../modules/authoring/testing/InMemoryCmsOutline';
import { InMemoryCmsStudies } from '../modules/authoring/testing/InMemoryCmsStudies';
import { InMemoryCmsSigns } from '../modules/authoring/testing/InMemoryCmsSigns';
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
  operatorAccounts?: InMemoryOperatorAccounts;
  outline?: InMemoryCmsOutline;
  cmsSigns?: InMemoryCmsSigns;
  cmsExercises?: InMemoryCmsExercises;
  cmsStudies?: InMemoryCmsStudies;
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
    operatorAccounts = new InMemoryOperatorAccounts(),
    outline = new InMemoryCmsOutline(),
    cmsSigns = new InMemoryCmsSigns(),
    cmsExercises = new InMemoryCmsExercises(),
    cmsStudies = new InMemoryCmsStudies(),
    signImages = new InMemorySignImageStorage(),
  }: InMemoryContainerOptions = {},
): Container {
  const ids = new SequentialIdGenerator();
  const passwords = new SequentialPasswordGenerator();
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
    getOperators: new GetOperators(admins),
    createOperator: new CreateOperator(admins, operatorAccounts, passwords),
    updateOperator: new UpdateOperator(admins),
    resetOperatorPassword: new ResetOperatorPassword(admins, operatorAccounts, passwords),
    getCmsTrails: new GetCmsTrails(outline),
    createOutlineItem: new CreateOutlineItem(outline, ids),
    renameOutlineItem: new RenameOutlineItem(outline),
    deleteOutlineItem: new DeleteOutlineItem(outline),
    reorderOutlineItems: new ReorderOutlineItems(outline),
    setOutlineItemVisibility: new SetOutlineItemVisibility(outline),
    getCmsSigns: new GetCmsSigns(cmsSigns),
    createSign: new CreateSign(cmsSigns, ids),
    updateSign: new UpdateSign(cmsSigns),
    deleteSign: new DeleteSign(cmsSigns),
    getLessonExercises: new GetLessonExercises(cmsExercises),
    createExercise: new CreateExercise(cmsExercises, cmsSigns, ids),
    updateExercise: new UpdateExercise(cmsExercises, cmsSigns),
    deleteExercise: new DeleteExercise(cmsExercises),
    reorderExercises: new ReorderExercises(cmsExercises),
    getCmsStudies: new GetCmsStudies(cmsStudies),
    createStudyGroup: new CreateStudyGroup(cmsStudies, ids),
    renameStudyGroup: new RenameStudyGroup(cmsStudies),
    deleteStudyGroup: new DeleteStudyGroup(cmsStudies),
    reorderStudyGroups: new ReorderStudyGroups(cmsStudies),
    getCmsStudy: new GetCmsStudy(cmsStudies),
    createStudy: new CreateStudy(cmsStudies, cmsSigns, ids),
    updateStudy: new UpdateStudy(cmsStudies, cmsSigns, ids),
    deleteStudy: new DeleteStudy(cmsStudies),
    reorderStudies: new ReorderStudies(cmsStudies),
    setStudyVisibility: new SetStudyVisibility(cmsStudies),
    createSignImageUpload: new CreateSignImageUpload(signImages, ids),
    getHome: new GetHome(trails, progress, progress),
    getLesson: new GetLesson(lessons, trails, progress),
    getProfile: new GetProfile(profiles),
    updateProfile: new UpdateProfile(profiles),
    deleteAccount: new DeleteAccount(profiles, authAdmin),
  };
}
