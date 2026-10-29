import { getMockStats, recordMockCompletion, resetMockServer } from '@/shared/api/mockServer';

import { mockGetHome } from './homeFixtures';

async function resolveHome() {
  const home = mockGetHome();
  await jest.runAllTimersAsync();
  return home;
}

beforeEach(() => {
  resetMockServer('at_risk');
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('mockGetHome', () => {
  it('resolves only after the simulated latency', async () => {
    const onResolved = jest.fn();
    void mockGetHome().then(onResolved);

    await Promise.resolve();
    expect(onResolved).not.toHaveBeenCalled();

    await jest.runAllTimersAsync();
    expect(onResolved).toHaveBeenCalledTimes(1);
  });

  it('shows the streak and XP of the shared mock, including a completed lesson', async () => {
    const before = await resolveHome();
    recordMockCompletion('9b2f6c1e-3d4a-4f5b-8c6d-7e8f9a0b1c2d', 50);
    const after = await resolveHome();

    expect(after.totalXp).toBe(before.totalXp + 50);
    expect(after.streak).toEqual(getMockStats().streak);
    expect(after.streak.status).toBe('done_today');
  });

  it('counts the XP of a lesson sent twice only once', async () => {
    const before = await resolveHome();
    recordMockCompletion('9b2f6c1e-3d4a-4f5b-8c6d-7e8f9a0b1c2d', 50);
    recordMockCompletion('9b2f6c1e-3d4a-4f5b-8c6d-7e8f9a0b1c2d', 50);

    expect((await resolveHome()).totalXp).toBe(before.totalXp + 50);
  });
});
