import type { StudiesResponse } from '@libras/contracts';

import { getStudies } from '../api/getStudies';
import { useStudyStore } from './studyStore';

jest.mock('../api/getStudies');
// Only the list is tested here; the reader's request is never made.
jest.mock('../api/getStudy');

const getStudiesMock = jest.mocked(getStudies);
const initialState = useStudyStore.getState();

function studies(title: string): StudiesResponse {
  return {
    groups: [
      {
        id: 'first-steps',
        title: 'Primeiros passos',
        studies: [{ id: title, title, description: 'Descrição.', pageCount: 1 }],
      },
    ],
  };
}

beforeEach(() => {
  useStudyStore.setState(initialState, true);
  getStudiesMock.mockReset();
});

describe('useStudyStore list', () => {
  it('brings in a study published after the first load when refreshed', async () => {
    getStudiesMock.mockResolvedValueOnce(studies('Alfabeto manual'));
    await useStudyStore.getState().loadStudies();

    getStudiesMock.mockResolvedValueOnce(studies('Números'));
    const refreshing = useStudyStore.getState().refreshStudies();
    expect(useStudyStore.getState().refreshing).toBe(true);
    await refreshing;

    const { refreshing: stillRefreshing, groups, listStatus } = useStudyStore.getState();
    expect(stillRefreshing).toBe(false);
    expect(listStatus).toBe('ready');
    expect(groups[0]?.studies[0]?.title).toBe('Números');
  });

  it('keeps the list on screen when a refresh fails', async () => {
    getStudiesMock.mockResolvedValueOnce(studies('Alfabeto manual'));
    await useStudyStore.getState().loadStudies();

    getStudiesMock.mockRejectedValueOnce(new Error('offline'));
    await useStudyStore.getState().refreshStudies();

    const { refreshing, groups, listStatus } = useStudyStore.getState();
    expect(refreshing).toBe(false);
    expect(listStatus).toBe('ready');
    expect(groups[0]?.studies[0]?.title).toBe('Alfabeto manual');
  });
});
