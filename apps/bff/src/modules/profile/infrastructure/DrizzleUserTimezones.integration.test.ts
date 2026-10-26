import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { insertUser } from '../../../shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from '../../../shared/infrastructure/db/testing/testDatabase';
import { DrizzleUserTimezones } from './DrizzleUserTimezones';

const inRollback = useTestDatabase();

describe('DrizzleUserTimezones.timezoneOf', () => {
  it(
    'returns the zone saved in the profile',
    inRollback(async (tx) => {
      const userId = await insertUser(tx, 'Asia/Tokyo');

      expect(await new DrizzleUserTimezones(tx).timezoneOf(userId)).toBe('Asia/Tokyo');
    }),
  );

  it(
    'throws for a user without a profile',
    inRollback(async (tx) => {
      await expect(new DrizzleUserTimezones(tx).timezoneOf(randomUUID())).rejects.toThrow(
        'not found',
      );
    }),
  );
});
