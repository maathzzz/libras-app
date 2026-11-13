import { describe, expect, it } from 'vitest';

import { insertAuthUser } from '../../../shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from '../../../shared/infrastructure/db/testing/testDatabase';
import { DrizzleAdminRepository } from './DrizzleAdminRepository';

const inRollback = useTestDatabase();

describe('DrizzleAdminRepository', () => {
  it(
    'saves an operator and finds it by user',
    inRollback(async (tx) => {
      const userId = await insertAuthUser(tx);
      const repository = new DrizzleAdminRepository(tx);

      await repository.save({ userId, email: 'it-admin@example.com', name: 'Ana', active: true });

      expect(await repository.findByUserId(userId)).toEqual({
        userId,
        email: 'it-admin@example.com',
        name: 'Ana',
        active: true,
      });
    }),
  );

  it(
    'updates an existing operator instead of adding another',
    inRollback(async (tx) => {
      const userId = await insertAuthUser(tx);
      const repository = new DrizzleAdminRepository(tx);
      await repository.save({ userId, email: 'it-admin@example.com', name: 'Ana', active: false });

      await repository.save({
        userId,
        email: 'it-admin@example.com',
        name: 'Ana Souza',
        active: true,
      });

      expect(await repository.findByUserId(userId)).toMatchObject({
        name: 'Ana Souza',
        active: true,
      });
    }),
  );

  it(
    'returns null for a user that is not an operator',
    inRollback(async (tx) => {
      const userId = await insertAuthUser(tx);

      expect(await new DrizzleAdminRepository(tx).findByUserId(userId)).toBeNull();
    }),
  );

  it(
    'lists every operator, active or not, by name',
    inRollback(async (tx) => {
      const repository = new DrizzleAdminRepository(tx);
      const zoe = await insertAuthUser(tx);
      const bia = await insertAuthUser(tx);
      await repository.save({
        userId: zoe,
        email: 'it-zoe@example.com',
        name: 'IT Zoe',
        active: true,
      });
      await repository.save({
        userId: bia,
        email: 'it-bia@example.com',
        name: 'IT Bia',
        active: false,
      });

      const own = (await repository.list()).filter((admin) => admin.email.startsWith('it-'));
      expect(own.map(({ name, active }) => [name, active])).toEqual([
        ['IT Bia', false],
        ['IT Zoe', true],
      ]);
    }),
  );
});
