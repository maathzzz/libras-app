import {
  disableDailyReminder,
  enableDailyReminder,
  isDailyReminderOn,
} from '../reminder/dailyReminder';
import { useSettingsStore } from './settingsStore';

// A factory, so the real module (and expo-notifications) is never loaded.
jest.mock('../reminder/dailyReminder', () => ({
  enableDailyReminder: jest.fn(),
  disableDailyReminder: jest.fn(),
  isDailyReminderOn: jest.fn(() => false),
}));

const enableMock = jest.mocked(enableDailyReminder);
const disableMock = jest.mocked(disableDailyReminder);
const isOnMock = jest.mocked(isDailyReminderOn);
const initialState = useSettingsStore.getState();

let scheduled = false;

beforeEach(() => {
  useSettingsStore.setState(initialState, true);
  jest.clearAllMocks();
  scheduled = false;
  isOnMock.mockImplementation(() => scheduled);
  enableMock.mockImplementation(async () => {
    scheduled = true;
    return true;
  });
  disableMock.mockImplementation(async () => {
    scheduled = false;
  });
});

describe('setReminder', () => {
  it('turns the reminder on when notifications are allowed', async () => {
    await useSettingsStore.getState().setReminder(true);

    expect(useSettingsStore.getState()).toMatchObject({
      reminderOn: true,
      reminderDenied: false,
      reminderBusy: false,
    });
  });

  it('stays off and explains why when notifications are denied', async () => {
    enableMock.mockResolvedValue(false);

    await useSettingsStore.getState().setReminder(true);

    expect(useSettingsStore.getState()).toMatchObject({ reminderOn: false, reminderDenied: true });
  });

  it('turns the reminder off', async () => {
    await useSettingsStore.getState().setReminder(true);

    await useSettingsStore.getState().setReminder(false);

    expect(disableMock).toHaveBeenCalled();
    expect(useSettingsStore.getState().reminderOn).toBe(false);
  });

  it('shows what is actually scheduled when scheduling fails', async () => {
    enableMock.mockRejectedValue(new Error('native failure'));

    await useSettingsStore.getState().setReminder(true);

    expect(useSettingsStore.getState()).toMatchObject({ reminderOn: false, reminderBusy: false });
  });

  it('ignores a second tap while the first one is running', async () => {
    const first = useSettingsStore.getState().setReminder(true);
    expect(useSettingsStore.getState().reminderBusy).toBe(true);
    await useSettingsStore.getState().setReminder(true);
    await first;

    expect(enableMock).toHaveBeenCalledTimes(1);
  });
});
