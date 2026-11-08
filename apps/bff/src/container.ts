import { AuthorizeAdmin } from './modules/admin/application/AuthorizeAdmin';
import { DrizzleAdminRepository } from './modules/admin/infrastructure/DrizzleAdminRepository';
import { CreateOutlineItem } from './modules/authoring/application/CreateOutlineItem';
import { CreateSign } from './modules/authoring/application/CreateSign';
import { CreateSignImageUpload } from './modules/authoring/application/CreateSignImageUpload';
import { DeleteOutlineItem } from './modules/authoring/application/DeleteOutlineItem';
import { DeleteSign } from './modules/authoring/application/DeleteSign';
import { GetDraftSigns } from './modules/authoring/application/GetDraftSigns';
import { GetDraftTrails } from './modules/authoring/application/GetDraftTrails';
import { RenameOutlineItem } from './modules/authoring/application/RenameOutlineItem';
import { ReorderOutlineItems } from './modules/authoring/application/ReorderOutlineItems';
import { UpdateSign } from './modules/authoring/application/UpdateSign';
import type { AuthoringUseCases } from './modules/authoring/http/authoringRoutes';
import { DrizzleDraftOutlineRepository } from './modules/authoring/infrastructure/DrizzleDraftOutlineRepository';
import { DrizzleDraftSignRepository } from './modules/authoring/infrastructure/DrizzleDraftSignRepository';
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
  const outline = new DrizzleDraftOutlineRepository(db);
  const draftSigns = new DrizzleDraftSignRepository(db);
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
    getDraftTrails: new GetDraftTrails(outline),
    createOutlineItem: new CreateOutlineItem(outline, ids),
    renameOutlineItem: new RenameOutlineItem(outline),
    deleteOutlineItem: new DeleteOutlineItem(outline),
    reorderOutlineItems: new ReorderOutlineItems(outline),
    getDraftSigns: new GetDraftSigns(draftSigns),
    createSign: new CreateSign(draftSigns, ids),
    updateSign: new UpdateSign(draftSigns),
    deleteSign: new DeleteSign(draftSigns),
    createSignImageUpload: new CreateSignImageUpload(signImages, ids),
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
