import type { ProfileResponse } from '@libras/contracts';

import { signOut } from '@/features/auth';
import { reloadHome } from '@/features/home';

import { deleteAccount, getProfile, updateProfile } from '../api/profileApi';
import { useProfileStore } from './profileStore';

jest.mock('../api/profileApi', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  deleteAccount: jest.fn(),
}));
jest.mock('@/features/home', () => ({ reloadHome: jest.fn() }));
jest.mock('@/features/auth', () => ({ signOut: jest.fn() }));

const getProfileMock = jest.mocked(getProfile);
const updateProfileMock = jest.mocked(updateProfile);
const deleteAccountMock = jest.mocked(deleteAccount);
const initialState = useProfileStore.getState();

const profile: ProfileResponse = {
  name: 'Ana Souza',
  dailyGoal: 3,
  startLevel: 'beginner',
};

beforeEach(() => {
  useProfileStore.setState(initialState, true);
  jest.clearAllMocks();
});

describe('useProfileStore', () => {
  it('loads the profile', async () => {
    getProfileMock.mockResolvedValue(profile);

    await useProfileStore.getState().load();

    expect(useProfileStore.getState().profile).toEqual(profile);
  });

  it('keeps the last profile when a reload fails', async () => {
    useProfileStore.setState({ profile });
    getProfileMock.mockRejectedValue(new TypeError('Network request failed'));

    await useProfileStore.getState().load();

    expect(useProfileStore.getState().profile).toEqual(profile);
  });

  it('reloads the home after the daily goal changes', async () => {
    updateProfileMock.mockResolvedValue({ ...profile, dailyGoal: 5 });

    await expect(useProfileStore.getState().update({ dailyGoal: 5 })).resolves.toBe(true);

    expect(useProfileStore.getState()).toMatchObject({
      profile: { dailyGoal: 5 },
      saving: false,
    });
    expect(reloadHome).toHaveBeenCalled();
  });

  it('does not reload the home for other changes', async () => {
    updateProfileMock.mockResolvedValue({ ...profile, name: 'Ana' });

    await useProfileStore.getState().update({ name: 'Ana' });

    expect(reloadHome).not.toHaveBeenCalled();
  });

  it('reports a change that could not be saved', async () => {
    useProfileStore.setState({ profile });
    updateProfileMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(useProfileStore.getState().update({ dailyGoal: 5 })).resolves.toBe(false);

    expect(useProfileStore.getState()).toMatchObject({ profile, saving: false });
  });

  it('ends the session once the account is deleted', async () => {
    deleteAccountMock.mockResolvedValue();

    await expect(useProfileStore.getState().deleteAccount()).resolves.toBe(true);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(useProfileStore.getState().deleting).toBe(false);
  });

  it('keeps the session when the account could not be deleted', async () => {
    deleteAccountMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(useProfileStore.getState().deleteAccount()).resolves.toBe(false);

    expect(signOut).not.toHaveBeenCalled();
    expect(useProfileStore.getState().deleting).toBe(false);
  });
});
