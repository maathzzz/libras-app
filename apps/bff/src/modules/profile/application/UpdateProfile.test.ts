import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryProfileRepository } from '../testing/InMemoryProfileRepository';
import { UpdateProfile } from './UpdateProfile';

const userId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';
const email = 'ana@example.com';

describe('UpdateProfile', () => {
  let profiles: InMemoryProfileRepository;
  let updateProfile: UpdateProfile;

  beforeEach(() => {
    profiles = new InMemoryProfileRepository();
    profiles.seed({ userId, name: 'ana', dailyGoal: 1, startLevel: 'beginner' });
    updateProfile = new UpdateProfile(profiles);
  });

  it('updates the display name and keeps the other fields', async () => {
    const result = await updateProfile.execute({ userId, email, changes: { name: 'Ana Souza' } });

    expect(result).toEqual({
      ok: true,
      value: { name: 'Ana Souza', dailyGoal: 1, startLevel: 'beginner' },
    });
    expect(await profiles.findById(userId)).toMatchObject({ name: 'Ana Souza' });
  });

  it('updates the daily goal and the start level', async () => {
    const result = await updateProfile.execute({
      userId,
      email,
      changes: { dailyGoal: 5, startLevel: 'conversational' },
    });

    expect(result).toEqual({
      ok: true,
      value: { name: 'ana', dailyGoal: 5, startLevel: 'conversational' },
    });
  });

  it('creates the profile first when the onboarding updates it before any read', async () => {
    const newUserId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e02';

    const result = await updateProfile.execute({
      userId: newUserId,
      email: 'bia@example.com',
      changes: { name: 'Bia', dailyGoal: 3, startLevel: 'basic' },
    });

    expect(result).toEqual({
      ok: true,
      value: { name: 'Bia', dailyGoal: 3, startLevel: 'basic' },
    });
    expect(await profiles.findById(newUserId)).toEqual({
      userId: newUserId,
      name: 'Bia',
      dailyGoal: 3,
      startLevel: 'basic',
    });
  });

  it('returns ACCOUNT_NOT_FOUND for a deleted account', async () => {
    const deletedUserId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e03';
    profiles.removeAuthUser(deletedUserId);

    const result = await updateProfile.execute({
      userId: deletedUserId,
      email,
      changes: { name: 'Ana' },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('ACCOUNT_NOT_FOUND');
  });
});
