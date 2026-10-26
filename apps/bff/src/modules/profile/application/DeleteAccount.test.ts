import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAuthAdmin } from '../testing/InMemoryAuthAdmin';
import { InMemoryProfileRepository } from '../testing/InMemoryProfileRepository';
import { DeleteAccount } from './DeleteAccount';

const userId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';
const otherUserId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e02';

describe('DeleteAccount', () => {
  let profiles: InMemoryProfileRepository;
  let authAdmin: InMemoryAuthAdmin;
  let deleteAccount: DeleteAccount;

  beforeEach(() => {
    profiles = new InMemoryProfileRepository();
    profiles.seed({ userId, name: 'Ana', dailyGoal: 1, startLevel: 'beginner' });
    profiles.seed({ userId: otherUserId, name: 'Bia', dailyGoal: 3, startLevel: 'basic' });
    authAdmin = new InMemoryAuthAdmin();
    deleteAccount = new DeleteAccount(profiles, authAdmin);
  });

  it('removes the learner data and the Auth user', async () => {
    await deleteAccount.execute({ userId });

    expect(await profiles.findById(userId)).toBeNull();
    expect(await profiles.findById(otherUserId)).not.toBeNull();
    expect(authAdmin.deletedUserIds).toEqual([userId]);
  });

  it('succeeds again for an account that is already gone', async () => {
    await deleteAccount.execute({ userId });

    await expect(deleteAccount.execute({ userId })).resolves.toBeUndefined();
    expect(await profiles.findById(userId)).toBeNull();
  });

  it('removes the learner data before a failure of Supabase Auth surfaces', async () => {
    authAdmin.failure = new Error('Supabase Auth unreachable');

    await expect(deleteAccount.execute({ userId })).rejects.toThrow('Supabase Auth unreachable');
    expect(await profiles.findById(userId)).toBeNull();

    // The app repeats the request once Auth is back.
    authAdmin.failure = null;
    await deleteAccount.execute({ userId });
    expect(authAdmin.deletedUserIds).toEqual([userId]);
  });
});
