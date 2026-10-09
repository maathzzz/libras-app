import { getHome } from './getHome';

async function resolveGetHome() {
  const home = getHome();
  await jest.runAllTimersAsync();
  return home;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getHome', () => {
  it('resolves only after the simulated latency', async () => {
    const onResolved = jest.fn();
    void getHome().then(onResolved);

    await Promise.resolve();
    expect(onResolved).not.toHaveBeenCalled();

    await jest.runAllTimersAsync();
    expect(onResolved).toHaveBeenCalledTimes(1);
  });

  it('walks through the three streak statuses, one per load', async () => {
    const statuses = [];
    for (let load = 0; load < 4; load += 1) {
      statuses.push((await resolveGetHome()).streak.status);
    }

    expect(new Set(statuses.slice(0, 3))).toEqual(new Set(['done_today', 'at_risk', 'broken']));
    expect(statuses[3]).toBe(statuses[0]);
  });
});
