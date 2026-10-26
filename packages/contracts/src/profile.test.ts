import { describe, expect, it } from 'vitest';

import { ProfileResponse, UpdateProfileRequest } from './profile';

const profile = {
  name: 'Ana Souza',
  dailyGoal: 3,
  startLevel: 'beginner',
};

describe('ProfileResponse', () => {
  it('accepts a valid profile', () => {
    expect(ProfileResponse.parse(profile)).toEqual(profile);
  });

  it('rejects a daily goal outside the options', () => {
    expect(ProfileResponse.safeParse({ ...profile, dailyGoal: 2 }).success).toBe(false);
  });

  it('rejects a blank name', () => {
    expect(ProfileResponse.safeParse({ ...profile, name: '   ' }).success).toBe(false);
  });
});

describe('UpdateProfileRequest', () => {
  it('accepts a single field', () => {
    expect(UpdateProfileRequest.parse({ dailyGoal: 5 })).toEqual({ dailyGoal: 5 });
  });

  it('rejects an empty update', () => {
    expect(UpdateProfileRequest.safeParse({}).success).toBe(false);
  });
});
