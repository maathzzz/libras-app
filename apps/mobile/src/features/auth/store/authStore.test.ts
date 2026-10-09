import { clearProfile } from '@/features/profile';
import { clearAccessToken, loadAccessToken, saveAccessToken } from '@/shared/api/session';

import { signInWithPassword, signUpWithPassword } from '../api/authApi';
import { useAuthStore } from './authStore';

jest.mock('../api/authApi', () => ({
  signInWithPassword: jest.fn(),
  signUpWithPassword: jest.fn(),
}));
jest.mock('@/shared/api/session', () => ({
  loadAccessToken: jest.fn(),
  saveAccessToken: jest.fn(),
  clearAccessToken: jest.fn(),
}));
jest.mock('@/features/profile', () => ({ clearProfile: jest.fn() }));

const signInMock = jest.mocked(signInWithPassword);
const signUpMock = jest.mocked(signUpWithPassword);
const loadTokenMock = jest.mocked(loadAccessToken);
const saveTokenMock = jest.mocked(saveAccessToken);
const initialState = useAuthStore.getState();
const credentials = { email: 'ana@exemplo.com', password: 'segredo1' };

beforeEach(() => {
  useAuthStore.setState(initialState, true);
  jest.clearAllMocks();
  signInMock.mockResolvedValue('token-1');
  signUpMock.mockResolvedValue('token-2');
});

describe('restore', () => {
  it('signs in when a session was saved', async () => {
    loadTokenMock.mockResolvedValue('token-1');

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('signedIn');
  });

  it('signs out when there is no session', async () => {
    loadTokenMock.mockResolvedValue(null);

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('signs out when the secure store cannot be read', async () => {
    loadTokenMock.mockRejectedValue(new Error('keychain'));

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('signedOut');
  });
});

describe('signIn', () => {
  it('saves the token and signs in', async () => {
    await useAuthStore.getState().signIn(credentials);

    expect(saveTokenMock).toHaveBeenCalledWith('token-1');
    expect(useAuthStore.getState()).toMatchObject({
      status: 'signedIn',
      submitting: false,
      error: null,
    });
  });

  it('stays signed out and explains when it fails', async () => {
    useAuthStore.setState({ status: 'signedOut' });
    signInMock.mockRejectedValue(new TypeError('Network request failed'));

    await useAuthStore.getState().signIn(credentials);

    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(useAuthStore.getState().error).not.toBeNull();
    expect(useAuthStore.getState().submitting).toBe(false);
  });
});

describe('signUp', () => {
  it('saves the onboarding choices before showing the signed-in screens', async () => {
    const statusWhenSaving: string[] = [];
    const onAccountCreated = jest.fn(async () => {
      statusWhenSaving.push(useAuthStore.getState().status);
    });

    await expect(useAuthStore.getState().signUp(credentials, onAccountCreated)).resolves.toBe(
      true,
    );

    expect(onAccountCreated).toHaveBeenCalledTimes(1);
    expect(statusWhenSaving).toEqual(['restoring']);
    expect(useAuthStore.getState().status).toBe('signedIn');
  });

  it('still signs in when the choices cannot be saved', async () => {
    await useAuthStore.getState().signUp(credentials, () => Promise.reject(new Error('offline')));

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', submitting: false });
  });

  it('does not create the profile when the account was not created', async () => {
    useAuthStore.setState({ status: 'signedOut' });
    signUpMock.mockRejectedValue(new TypeError('Network request failed'));
    const onAccountCreated = jest.fn(async () => undefined);

    await expect(useAuthStore.getState().signUp(credentials, onAccountCreated)).resolves.toBe(
      false,
    );

    expect(onAccountCreated).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(useAuthStore.getState().error).not.toBeNull();
  });
});

describe('signOut', () => {
  it('forgets the session and the profile', async () => {
    useAuthStore.setState({ status: 'signedIn' });

    await useAuthStore.getState().signOut();

    expect(clearAccessToken).toHaveBeenCalled();
    expect(clearProfile).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });
});
