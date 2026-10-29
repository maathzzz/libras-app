import { HomeResponse } from '@libras/contracts';

import { ApiError } from '@/shared/api/client';

import { getHome } from '../api/getHome';
import { mockHome } from '../api/homeFixtures';
import { useHomeStore } from './homeStore';

jest.mock('../api/getHome');

const getHomeMock = jest.mocked(getHome);
const initialState = useHomeStore.getState();
const home = mockHome();

beforeEach(() => {
  useHomeStore.setState(initialState, true);
  getHomeMock.mockReset();
});

describe('home mock', () => {
  it('satisfies the HomeResponse contract', () => {
    expect(HomeResponse.safeParse(home).success).toBe(true);
  });
});

describe('useHomeStore', () => {
  it('is loading until the home arrives', async () => {
    getHomeMock.mockResolvedValue(home);

    const loading = useHomeStore.getState().load();
    expect(useHomeStore.getState().status).toBe('loading');
    await loading;

    expect(useHomeStore.getState()).toMatchObject({ status: 'ready', home });
  });

  it('tells a missing connection apart when the first load fails', async () => {
    getHomeMock.mockRejectedValue(new ApiError('network', 'Sem resposta'));

    await useHomeStore.getState().load();

    expect(useHomeStore.getState()).toMatchObject({
      status: 'error',
      errorReason: 'offline',
      home: null,
    });
  });

  it('reports a server failure when the first load fails with a 5xx', async () => {
    getHomeMock.mockRejectedValue(new ApiError('server', 'falhou', 500, 'INTERNAL_ERROR'));

    await useHomeStore.getState().load();

    expect(useHomeStore.getState()).toMatchObject({ status: 'error', errorReason: 'server' });
  });

  it('clears the error once a retry works', async () => {
    getHomeMock.mockRejectedValueOnce(new ApiError('network', 'Sem resposta'));
    getHomeMock.mockResolvedValueOnce(home);

    await useHomeStore.getState().load();
    await useHomeStore.getState().load();

    expect(useHomeStore.getState()).toMatchObject({ status: 'ready', errorReason: null, home });
  });

  it('keeps the last home when a reload fails', async () => {
    getHomeMock.mockResolvedValueOnce(home);
    getHomeMock.mockRejectedValueOnce(new ApiError('network', 'Sem resposta'));

    await useHomeStore.getState().load();
    await useHomeStore.getState().load();

    expect(useHomeStore.getState()).toMatchObject({ status: 'ready', home });
  });

  it('clears the refreshing flag after a refresh', async () => {
    getHomeMock.mockResolvedValue(home);

    const refreshing = useHomeStore.getState().refresh();
    expect(useHomeStore.getState().refreshing).toBe(true);
    await refreshing;

    expect(useHomeStore.getState()).toMatchObject({ refreshing: false, home });
  });
});
