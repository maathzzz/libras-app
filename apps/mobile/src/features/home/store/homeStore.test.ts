import { HomeResponse } from '@libras/contracts';

import { fetchHome } from '../api/homeApi';
import { newUserHome, returningUserHome } from '../api/homeMocks';
import { useHomeStore } from './homeStore';

jest.mock('../api/homeApi');

const fetchHomeMock = jest.mocked(fetchHome);
const initialState = useHomeStore.getState();

beforeEach(() => {
  useHomeStore.setState(initialState, true);
  fetchHomeMock.mockReset();
});

describe('home mocks', () => {
  it('satisfy the HomeResponse contract', () => {
    expect(HomeResponse.safeParse(returningUserHome).success).toBe(true);
    expect(HomeResponse.safeParse(newUserHome).success).toBe(true);
  });
});

describe('useHomeStore', () => {
  it('loads the home', async () => {
    fetchHomeMock.mockResolvedValue(returningUserHome);

    await useHomeStore.getState().load();

    expect(useHomeStore.getState()).toMatchObject({ status: 'ready', home: returningUserHome });
  });

  it('shows an error when the first load fails', async () => {
    fetchHomeMock.mockRejectedValue(new Error('offline'));

    await useHomeStore.getState().load();

    expect(useHomeStore.getState()).toMatchObject({ status: 'error', home: null });
  });

  it('keeps the last home when a reload fails', async () => {
    fetchHomeMock.mockResolvedValueOnce(returningUserHome);
    fetchHomeMock.mockRejectedValueOnce(new Error('offline'));

    await useHomeStore.getState().load();
    await useHomeStore.getState().load();

    expect(useHomeStore.getState()).toMatchObject({ status: 'ready', home: returningUserHome });
  });

  it('clears the refreshing flag after a refresh', async () => {
    fetchHomeMock.mockResolvedValue(newUserHome);

    const refreshing = useHomeStore.getState().refresh();
    expect(useHomeStore.getState().refreshing).toBe(true);
    await refreshing;

    expect(useHomeStore.getState()).toMatchObject({ refreshing: false, home: newUserHome });
  });
});
