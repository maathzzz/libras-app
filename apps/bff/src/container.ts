import { AuthorizeAdmin } from './modules/admin/application/AuthorizeAdmin';
import { DrizzleAdminRepository } from './modules/admin/infrastructure/DrizzleAdminRepository';
import { CreateExercise } from './modules/authoring/application/CreateExercise';
import { CreateOutlineItem } from './modules/authoring/application/CreateOutlineItem';
import { CreateSign } from './modules/authoring/application/CreateSign';
import { CreateSignImageUpload } from './modules/authoring/application/CreateSignImageUpload';
import { DeleteExercise } from './modules/authoring/application/DeleteExercise';
import { DeleteOutlineItem } from './modules/authoring/application/DeleteOutlineItem';
import { DeleteSign } from './modules/authoring/application/DeleteSign';
import { GetCmsSigns } from './modules/authoring/application/GetCmsSigns';
import { GetCmsTrails } from './modules/authoring/application/GetCmsTrails';
import { GetLessonExercises } from './modules/authoring/application/GetLessonExercises';
import { RenameOutlineItem } from './modules/authoring/application/RenameOutlineItem';
import { ReorderExercises } from './modules/authoring/application/ReorderExercises';
import { ReorderOutlineItems } from './modules/authoring/application/ReorderOutlineItems';
import { SetOutlineItemVisibility } from './modules/authoring/application/SetOutlineItemVisibility';
import { SetStudyVisibility } from './modules/authoring/application/SetStudyVisibility';
import { UpdateExercise } from './modules/authoring/application/UpdateExercise';
import { CreateStudy } from './modules/authoring/application/CreateStudy';
import { CreateStudyGroup } from './modules/authoring/application/CreateStudyGroup';
import { DeleteStudy } from './modules/authoring/application/DeleteStudy';
import { DeleteStudyGroup } from './modules/authoring/application/DeleteStudyGroup';
import { GetCmsStudies } from './modules/authoring/application/GetCmsStudies';
import { GetCmsStudy } from './modules/authoring/application/GetCmsStudy';
import { RenameStudyGroup } from './modules/authoring/application/RenameStudyGroup';
import { ReorderStudies } from './modules/authoring/application/ReorderStudies';
import { ReorderStudyGroups } from './modules/authoring/application/ReorderStudyGroups';
import { UpdateStudy } from './modules/authoring/application/UpdateStudy';
import { UpdateSign } from './modules/authoring/application/UpdateSign';
import type { AuthoringUseCases } from './modules/authoring/http/authoringRoutes';
import { DrizzleCmsExerciseRepository } from './modules/authoring/infrastructure/DrizzleCmsExerciseRepository';
import { DrizzleCmsOutlineRepository } from './modules/authoring/infrastructure/DrizzleCmsOutlineRepository';
import { DrizzleCmsStudyRepository } from './modules/authoring/infrastructure/DrizzleCmsStudyRepository';
import { DrizzleCmsSignRepository } from './modules/authoring/infrastructure/DrizzleCmsSignRepository';
import { SupabaseSignImageStorage } from './modules/authoring/infrastructure/SupabaseSignImageStorage';
import { GetStudies } from './modules/curriculum/application/GetStudies';
import { GetStudy } from './modules/curriculum/application/GetStudy';
import { DrizzleLessonRepository } from './modules/curriculum/infrastructure/DrizzleLessonRepository';
import { DrizzleStudyRepository } from './modules/curriculum/infrastructure/DrizzleStudyRepository';
import { DrizzleTrailRepository } from './modules/curriculum/infrastructure/DrizzleTrailRepository';
import { DeleteAccount } from './modules/profile/application/DeleteAccount';
import { GetProfile } from './modules/profile/application/GetProfile';
import { UpdateProfile } from './modules/profile/application/UpdateProfile';
import { DrizzleProfileRepository } from './modules/profile/infrastructure/DrizzleProfileRepository';
import { SupabaseAuthAdmin } from './modules/profile/infrastructure/SupabaseAuthAdmin';
import { CompleteLesson } from './modules/progress/application/CompleteLesson';
import { GetAchievements } from './modules/progress/application/GetAchievements';
import { GetHome } from './modules/progress/application/GetHome';
import { GetLesson } from './modules/progress/application/GetLesson';
import { CurriculumTrailCatalog } from './modules/progress/infrastructure/CurriculumTrailCatalog';
import { DrizzleProgressStore } from './modules/progress/infrastructure/DrizzleProgressStore';
import type { Clock } from './shared/application/Clock';
import { RandomIdGenerator } from './shared/application/RandomIdGenerator';
import { SystemClock } from './shared/application/SystemClock';
import {
  createAccessTokenVerifier,
  supabaseJwks,
  type AccessTokenVerifier,
} from './shared/infrastructure/auth';
import type { DbExecutor } from './shared/infrastructure/db/client';

// Composition root: the one place that picks concrete implementations and wires them by
// constructor. Unit tests build their own objects with in-memory fakes.
export interface Container extends AuthoringUseCases {
  clock: Clock;
  verifyAccessToken: AccessTokenVerifier;
  completeLesson: CompleteLesson;
  getAchievements: GetAchievements;
  getStudies: GetStudies;
  getStudy: GetStudy;
  authorizeAdmin: AuthorizeAdmin;
  getHome: GetHome;
  getLesson: GetLesson;
  getProfile: GetProfile;
  updateProfile: UpdateProfile;
  deleteAccount: DeleteAccount;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseSecretKey: string;
}

export function createContainer(
  db: DbExecutor,
  { supabaseUrl, supabaseSecretKey }: SupabaseConfig,
): Container {
  const clock = new SystemClock();
  const progress = new DrizzleProgressStore(db);
  // The curriculum repository matches the progress LessonCatalog port by shape.
  const lessons = new DrizzleLessonRepository(db);
  const trails = new CurriculumTrailCatalog(new DrizzleTrailRepository(db));
  const profiles = new DrizzleProfileRepository(db);
  const studies = new DrizzleStudyRepository(db);
  const ids = new RandomIdGenerator();
  const outline = new DrizzleCmsOutlineRepository(db);
  const cmsSigns = new DrizzleCmsSignRepository(db);
  const cmsExercises = new DrizzleCmsExerciseRepository(db);
  const cmsStudies = new DrizzleCmsStudyRepository(db);
  const signImages = new SupabaseSignImageStorage(supabaseUrl, supabaseSecretKey);

  return {
    clock,
    // Supabase issues user tokens with this issuer and audience.
    verifyAccessToken: createAccessTokenVerifier({
      jwks: supabaseJwks(supabaseUrl),
      issuer: `${supabaseUrl}/auth/v1`,
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
    authorizeAdmin: new AuthorizeAdmin(new DrizzleAdminRepository(db)),
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
    createSignImageUpload: new CreateSignImageUpload(signImages, ids),
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
    getHome: new GetHome(trails, progress, progress),
    getLesson: new GetLesson(lessons, trails, progress),
    getProfile: new GetProfile(profiles),
    updateProfile: new UpdateProfile(profiles),
    deleteAccount: new DeleteAccount(
      profiles,
      new SupabaseAuthAdmin(supabaseUrl, supabaseSecretKey),
    ),
  };
}
