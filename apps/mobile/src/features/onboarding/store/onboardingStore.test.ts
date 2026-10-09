import { signUp } from '@/features/auth';
import { updateProfile } from '@/features/profile';

import { useOnboardingStore } from './onboardingStore';

jest.mock('@/features/auth', () => ({ signUp: jest.fn() }));
jest.mock('@/features/profile', () => ({ updateProfile: jest.fn() }));

const signUpMock = jest.mocked(signUp);
const updateProfileMock = jest.mocked(updateProfile);
const initialState = useOnboardingStore.getState();
const account = { name: 'Ana Souza', email: 'ana@exemplo.com', password: 'segredo1' };

beforeEach(() => {
  useOnboardingStore.setState(initialState, true);
  jest.clearAllMocks();
  updateProfileMock.mockResolvedValue(true);
  // Runs the profile update the way the auth store does once the account exists.
  signUpMock.mockImplementation(async (_credentials, onAccountCreated) => {
    await onAccountCreated?.();
    return true;
  });
});

describe('createAccount', () => {
  it('creates the account with the first step data and saves every choice', async () => {
    useOnboardingStore.getState().setAccount(account);
    useOnboardingStore.getState().setStartLevel('basic');
    useOnboardingStore.getState().setDailyGoal(5);

    await expect(useOnboardingStore.getState().createAccount()).resolves.toBe(true);

    expect(signUpMock).toHaveBeenCalledWith(
      { email: 'ana@exemplo.com', password: 'segredo1' },
      expect.any(Function),
    );
    expect(updateProfileMock).toHaveBeenCalledWith({
      name: 'Ana Souza',
      startLevel: 'basic',
      dailyGoal: 5,
      timezone: expect.any(String),
    });
  });

  it('forgets the password once the account exists', async () => {
    useOnboardingStore.getState().setAccount(account);

    await useOnboardingStore.getState().createAccount();

    expect(useOnboardingStore.getState().account).toBeNull();
  });

  it('keeps the data for another try when the account was not created', async () => {
    signUpMock.mockResolvedValue(false);
    useOnboardingStore.getState().setAccount(account);

    await expect(useOnboardingStore.getState().createAccount()).resolves.toBe(false);

    expect(useOnboardingStore.getState().account).toEqual(account);
  });

  it('creates nothing without the first step data', async () => {
    await expect(useOnboardingStore.getState().createAccount()).resolves.toBe(false);

    expect(signUpMock).not.toHaveBeenCalled();
  });
});
