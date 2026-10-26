import { DrizzleLessonRepository } from './modules/curriculum/infrastructure/DrizzleLessonRepository';
import { DeleteAccount } from './modules/profile/application/DeleteAccount';
import { GetProfile } from './modules/profile/application/GetProfile';
import { UpdateProfile } from './modules/profile/application/UpdateProfile';
import { DrizzleProfileRepository } from './modules/profile/infrastructure/DrizzleProfileRepository';
import { SupabaseAuthAdmin } from './modules/profile/infrastructure/SupabaseAuthAdmin';
import { CompleteLesson } from './modules/progress/application/CompleteLesson';
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
  const profiles = new DrizzleProfileRepository(db);

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
      // The curriculum repository matches the progress port by shape.
      new DrizzleLessonRepository(db),
      clock,
    ),
    getProfile: new GetProfile(profiles),
    updateProfile: new UpdateProfile(profiles),
    deleteAccount: new DeleteAccount(
      profiles,
      new SupabaseAuthAdmin(supabaseUrl, supabaseSecretKey),
    ),
  };
}
