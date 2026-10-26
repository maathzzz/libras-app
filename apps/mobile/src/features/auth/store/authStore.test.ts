import { endSession, hasSavedSession, onSessionEnded } from '@/shared/api/session';

import * as authApi from '../api/authApi';
import { AuthFailure } from '../api/authApi';
import { useAuthStore } from './authStore';

jest.mock('../api/authApi', () => ({
  ...jest.requireActual<typeof authApi>('../api/authApi'),
  signInWithPassword: jest.fn(),
  signUpWithPassword: jest.fn(),
  requestPasswordReset: jest.fn(),
  verifyResetCode: jest.fn(),
  updatePassword: jest.fn(),
}));
jest.mock('@/shared/api/session', () => ({
  hasSavedSession: jest.fn(),
  endSession: jest.fn(),
  onSessionEnded: jest.fn(),
}));

const api = jest.mocked(authApi);
const hasSavedSessionMock = jest.mocked(hasSavedSession);
const endSessionMock = jest.mocked(endSession);
const onSessionEndedMock = jest.mocked(onSessionEnded);
const initialState = useAuthStore.getState();
const credentials = { email: 'ana@exemplo.com', password: 'segredo1' };

// The store subscribes once per app run, on its first restore.
let sessionEndedListener: (() => void) | undefined;
onSessionEndedMock.mockImplementation((listener) => {
  sessionEndedListener = listener;
  return () => undefined;
});

beforeEach(() => {
  useAuthStore.setState({ ...initialState, status: 'signedOut' }, true);
  jest.clearAllMocks();
  api.signInWithPassword.mockResolvedValue();
  api.signUpWithPassword.mockResolvedValue();
  api.requestPasswordReset.mockResolvedValue();
  api.verifyResetCode.mockResolvedValue();
  api.updatePassword.mockResolvedValue();
  endSessionMock.mockResolvedValue();
});

describe('restore', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'restoring' });
  });

  it('signs in when a session was saved', async () => {
    hasSavedSessionMock.mockResolvedValue(true);

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('signedIn');
  });

  it('signs out when there is no session', async () => {
    hasSavedSessionMock.mockResolvedValue(false);

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('signs out when the saved session cannot be read', async () => {
    hasSavedSessionMock.mockRejectedValue(new Error('keychain'));

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('signs out when the session ends elsewhere, e.g. it could not be renewed', async () => {
    hasSavedSessionMock.mockResolvedValue(true);
    await useAuthStore.getState().restore();
    expect(useAuthStore.getState().status).toBe('signedIn');

    sessionEndedListener?.();

    expect(sessionEndedListener).toBeDefined();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });
});

describe('signIn', () => {
  it('signs in with the e-mail and password', async () => {
    await expect(useAuthStore.getState().signIn(credentials)).resolves.toBe(true);

    expect(api.signInWithPassword).toHaveBeenCalledWith(credentials);
    expect(useAuthStore.getState()).toMatchObject({
      status: 'signedIn',
      submitting: false,
      error: null,
    });
  });

  it('explains a wrong password and stays signed out', async () => {
    api.signInWithPassword.mockRejectedValue(new AuthFailure('invalidCredentials'));

    await expect(useAuthStore.getState().signIn(credentials)).resolves.toBe(false);

    expect(useAuthStore.getState()).toMatchObject({
      status: 'signedOut',
      submitting: false,
      error: 'E-mail ou senha incorretos.',
    });
  });

  it('explains when there is no connection', async () => {
    api.signInWithPassword.mockRejectedValue(new AuthFailure('offline'));

    await useAuthStore.getState().signIn(credentials);

    expect(useAuthStore.getState().error).toMatch(/Sem conexão/);
  });

});

describe('signUp', () => {
  it('signs in right away with the session of the new account', async () => {
    await expect(useAuthStore.getState().signUp(credentials)).resolves.toBe(true);

    expect(api.signUpWithPassword).toHaveBeenCalledWith(credentials);
    expect(useAuthStore.getState()).toMatchObject({
      status: 'signedIn',
      submitting: false,
      error: null,
    });
  });

  it('saves the onboarding choices before showing the signed-in screens', async () => {
    const statusWhenSaving: string[] = [];
    const onAccountCreated = jest.fn(async () => {
      statusWhenSaving.push(useAuthStore.getState().status);
    });

    await useAuthStore.getState().signUp(credentials, onAccountCreated);

    expect(onAccountCreated).toHaveBeenCalledTimes(1);
    expect(statusWhenSaving).toEqual(['signedOut']);
    expect(useAuthStore.getState().status).toBe('signedIn');
  });

  it('still signs in when the choices cannot be saved', async () => {
    await useAuthStore
      .getState()
      .signUp(credentials, () => Promise.reject(new Error('offline')));

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', submitting: false });
  });

  // Confirm email turned back on in Supabase: the account exists but opens no session.
  it('explains and stays on the auth screens when the new account opens no session', async () => {
    api.signUpWithPassword.mockRejectedValue(new AuthFailure('confirmationRequired'));
    const onAccountCreated = jest.fn(async () => undefined);

    await expect(useAuthStore.getState().signUp(credentials, onAccountCreated)).resolves.toBe(
      false,
    );

    expect(onAccountCreated).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'signedOut',
      submitting: false,
      error:
        'Não foi possível concluir seu cadastro agora. Tente de novo mais tarde ou entre em contato com o suporte.',
    });
  });

  it('explains an e-mail that already has an account', async () => {
    api.signUpWithPassword.mockRejectedValue(new AuthFailure('emailInUse'));

    await expect(useAuthStore.getState().signUp(credentials)).resolves.toBe(false);

    expect(useAuthStore.getState().error).toMatch(/já tem uma conta/);
  });
});

describe('password reset', () => {
  it('stays on the auth screens after the code until the new password is saved', async () => {
    await useAuthStore.getState().requestPasswordReset('ana@exemplo.com');
    await expect(useAuthStore.getState().verifyResetCode('123456')).resolves.toBe(true);

    expect(api.verifyResetCode).toHaveBeenCalledWith('ana@exemplo.com', '123456');
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', resetVerified: true });

    await expect(useAuthStore.getState().setNewPassword('nova-senha')).resolves.toBe(true);

    expect(api.updatePassword).toHaveBeenCalledWith('nova-senha');
    expect(useAuthStore.getState()).toMatchObject({
      status: 'signedIn',
      resetEmail: null,
      resetVerified: false,
    });
  });

  it('ends the session the code opened when the learner gives up', async () => {
    await useAuthStore.getState().requestPasswordReset('ana@exemplo.com');
    await useAuthStore.getState().verifyResetCode('123456');

    await useAuthStore.getState().cancelPasswordReset();

    expect(endSessionMock).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', resetVerified: false });
  });

  it('ends no session when the code was never accepted', async () => {
    await useAuthStore.getState().cancelPasswordReset();

    expect(endSessionMock).not.toHaveBeenCalled();
  });
});

describe('signOut', () => {
  it('ends the session', async () => {
    useAuthStore.setState({ status: 'signedIn' });

    await useAuthStore.getState().signOut();

    expect(endSessionMock).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('signs out even when Supabase cannot be reached', async () => {
    useAuthStore.setState({ status: 'signedIn' });
    endSessionMock.mockRejectedValue(new TypeError('Network request failed'));

    await useAuthStore.getState().signOut();

    expect(useAuthStore.getState().status).toBe('signedOut');
  });
});
