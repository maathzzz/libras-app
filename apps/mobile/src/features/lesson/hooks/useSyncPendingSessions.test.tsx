import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuthStatus, type AuthStatus } from '@/features/auth';
import { reloadHome } from '@/features/home';

import { pendingSessions } from '../api/pendingSessions';
import { useSyncPendingSessions } from './useSyncPendingSessions';

jest.mock('@/features/auth', () => ({ useAuthStatus: jest.fn() }));
jest.mock('@/features/home', () => ({ reloadHome: jest.fn() }));
jest.mock('../api/pendingSessions', () => ({ pendingSessions: { flush: jest.fn() } }));

const flushMock = jest.mocked(pendingSessions.flush);
const reloadHomeMock = jest.mocked(reloadHome);
const authStatusMock = jest.mocked(useAuthStatus);
const removeListener = jest.fn();
let changeAppState: (state: AppStateStatus) => void = () => {};

beforeEach(() => {
  authStatusMock.mockReset().mockReturnValue('signedIn');
  flushMock.mockReset().mockResolvedValue({ sent: 0 });
  reloadHomeMock.mockReset().mockResolvedValue(undefined);
  removeListener.mockReset();
  changeAppState = () => {};
  jest
    .spyOn(AppState, 'addEventListener')
    .mockClear()
    .mockImplementation((_type, listener) => {
      changeAppState = listener;
      return { remove: removeListener };
    });
});

// RNTL 14 renders asynchronously; awaiting also lets the first flush settle.
const renderSync = () => renderHook(() => useSyncPendingSessions());

describe('useSyncPendingSessions', () => {
  it('sends the pending sessions when the app opens', async () => {
    await renderSync();

    expect(flushMock).toHaveBeenCalledTimes(1);
  });

  it('sends them again when the app comes back to the foreground', async () => {
    await renderSync();

    await act(async () => changeAppState('background'));
    expect(flushMock).toHaveBeenCalledTimes(1);

    await act(async () => changeAppState('active'));
    expect(flushMock).toHaveBeenCalledTimes(2);
  });

  it('reloads the home only when a session was sent', async () => {
    await renderSync();
    expect(reloadHomeMock).not.toHaveBeenCalled();

    flushMock.mockResolvedValue({ sent: 1 });
    await act(async () => changeAppState('active'));

    expect(reloadHomeMock).toHaveBeenCalledTimes(1);
  });

  it('sends nothing while signed out, so the BFF does not refuse and drop the lessons', async () => {
    authStatusMock.mockReturnValue('signedOut');
    await renderSync();

    expect(flushMock).not.toHaveBeenCalled();
    expect(AppState.addEventListener).not.toHaveBeenCalled();
  });

  it('sends the pending sessions as soon as the learner signs in', async () => {
    let status: AuthStatus = 'signedOut';
    authStatusMock.mockImplementation(() => status);
    const { rerender } = await renderSync();
    expect(flushMock).not.toHaveBeenCalled();

    status = 'signedIn';
    await rerender({});

    expect(flushMock).toHaveBeenCalledTimes(1);
  });

  it('stops listening when unmounted', async () => {
    const { unmount } = await renderSync();

    await unmount();

    expect(removeListener).toHaveBeenCalled();
  });
});
