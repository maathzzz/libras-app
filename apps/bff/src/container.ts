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
import { SystemClock } from './shared/application/SystemClock';
import {
  createAccessTokenVerifier,
  supabaseJwks,
  type AccessTokenVerifier,
} from './shared/infrastructure/auth';
import type { DbExecutor } from './shared/infrastructure/db/client';

// Composition root: the one place that picks concrete implementations and wires them by
// constructor. Unit tests build their own objects with in-memory fakes.
export interface Container {
  clock: Clock;
  verifyAccessToken: AccessTokenVerifier;
  completeLesson: CompleteLesson;
  getAchievements: GetAchievements;
  getStudies: GetStudies;
  getStudy: GetStudy;
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
