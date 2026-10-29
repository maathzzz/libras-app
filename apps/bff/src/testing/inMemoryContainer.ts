import { createLocalJWKSet, type JWTVerifyGetKey } from 'jose';

import type { Container } from '../container';
import { DeleteAccount } from '../modules/profile/application/DeleteAccount';
import { GetProfile } from '../modules/profile/application/GetProfile';
import { UpdateProfile } from '../modules/profile/application/UpdateProfile';
import { InMemoryAuthAdmin } from '../modules/profile/testing/InMemoryAuthAdmin';
import { InMemoryProfileRepository } from '../modules/profile/testing/InMemoryProfileRepository';
import { CompleteLesson } from '../modules/progress/application/CompleteLesson';
import { GetHome } from '../modules/progress/application/GetHome';
import { GetLesson } from '../modules/progress/application/GetLesson';
import { InMemoryLessonCatalog } from '../modules/progress/testing/InMemoryLessonCatalog';
import { InMemoryProgressStore } from '../modules/progress/testing/InMemoryProgressStore';
import { InMemoryTrailCatalog } from '../modules/progress/testing/InMemoryTrailCatalog';
import type { Clock } from '../shared/application/Clock';
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
  }: InMemoryContainerOptions = {},
): Container {
  return {
    clock,
    verifyAccessToken: createAccessTokenVerifier({
      jwks,
      issuer: testIssuer,
      audience: 'authenticated',
      clock,
    }),
    completeLesson: new CompleteLesson(progress, progress, lessons, trails, progress, clock),
    getHome: new GetHome(trails, progress, progress),
    getLesson: new GetLesson(lessons, trails, progress),
    getProfile: new GetProfile(profiles),
    updateProfile: new UpdateProfile(profiles),
    deleteAccount: new DeleteAccount(profiles, authAdmin),
  };
}
