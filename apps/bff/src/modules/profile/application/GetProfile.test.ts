import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryProfileRepository } from '../testing/InMemoryProfileRepository';
import { GetProfile } from './GetProfile';

const userId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';

describe('GetProfile', () => {
  let profiles: InMemoryProfileRepository;
  let getProfile: GetProfile;

  beforeEach(() => {
    profiles = new InMemoryProfileRepository();
    getProfile = new GetProfile(profiles);
  });

  it('creates the profile on the first access, named after the email', async () => {
    const result = await getProfile.execute({ userId, email: 'ana.souza@example.com' });

    expect(result).toEqual({
      ok: true,
      value: { name: 'ana.souza', dailyGoal: 1, startLevel: 'beginner' },
    });
    expect(profiles.profiles).toEqual([
      { userId, name: 'ana.souza', dailyGoal: 1, startLevel: 'beginner' },
    ]);
  });

  it('names the profile "Aprendiz" when the token has no email', async () => {
    const result = await getProfile.execute({ userId, email: null });

    expect(result.ok && result.value.name).toBe('Aprendiz');
  });

  it('cuts a long email name to 60 characters', async () => {
    const result = await getProfile.execute({ userId, email: `${'a'.repeat(80)}@example.com` });

    expect(result.ok && result.value.name).toBe('a'.repeat(60));
  });

  it('returns the existing profile without creating another', async () => {
    profiles.seed({ userId, name: 'Ana Souza', dailyGoal: 5, startLevel: 'basic' });

    const result = await getProfile.execute({ userId, email: 'outro@example.com' });

    expect(result).toEqual({
      ok: true,
      value: { name: 'Ana Souza', dailyGoal: 5, startLevel: 'basic' },
    });
    expect(profiles.profiles).toHaveLength(1);
  });

  it('returns ACCOUNT_NOT_FOUND when the Auth user no longer exists', async () => {
    profiles.removeAuthUser(userId);

    const result = await getProfile.execute({ userId, email: 'ana@example.com' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('ACCOUNT_NOT_FOUND');
    expect(profiles.profiles).toHaveLength(0);
  });
});
