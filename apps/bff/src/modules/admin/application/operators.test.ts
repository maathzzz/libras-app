import { beforeEach, describe, expect, it } from 'vitest';

import type { Admin } from '../domain/AdminRepository';
import type { OperatorAccounts } from '../domain/OperatorAccounts';
import { InMemoryAdminRepository } from '../testing/InMemoryAdminRepository';
import {
  InMemoryOperatorAccounts,
  SequentialPasswordGenerator,
} from '../testing/InMemoryOperatorAccounts';
import { CreateOperator } from './CreateOperator';
import { GetOperators } from './GetOperators';
import { ResetOperatorPassword } from './ResetOperatorPassword';
import { UpdateOperator } from './UpdateOperator';

const ana: Admin = {
  userId: '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01',
  email: 'ana@example.com',
  name: 'Ana',
  active: true,
};
const bruno: Admin = {
  userId: '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e02',
  email: 'bruno@example.com',
  name: 'Bruno',
  active: true,
};

let admins: InMemoryAdminRepository;
let accounts: InMemoryOperatorAccounts;
let passwords: SequentialPasswordGenerator;

beforeEach(() => {
  admins = new InMemoryAdminRepository([bruno, ana]);
  accounts = new InMemoryOperatorAccounts(new Set(['aluno@example.com']));
  passwords = new SequentialPasswordGenerator();
});

describe('GetOperators', () => {
  it('lists the operators by name', async () => {
    const { operators } = await new GetOperators(admins).execute();
    expect(operators.map((operator) => operator.name)).toEqual(['Ana', 'Bruno']);
  });
});

describe('CreateOperator', () => {
  it('creates an active operator with a new account and a temporary password', async () => {
    const result = await new CreateOperator(admins, accounts, passwords).execute({
      email: 'carla+cms@example.com',
      name: 'Carla',
    });

    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.temporaryPassword).toBe('temporary-password-1');
    expect(accounts.passwords.get(result.value.userId)).toBe('temporary-password-1');
    expect(await admins.findByUserId(result.value.userId)).toEqual({
      userId: result.value.userId,
      email: 'carla+cms@example.com',
      name: 'Carla',
      active: true,
    });
  });

  it('refuses an e-mail that already has an account, such as a learner', async () => {
    const result = await new CreateOperator(admins, accounts, passwords).execute({
      email: 'aluno@example.com',
      name: 'Aluno',
    });

    expect(result.ok || result.error.code).toBe('EMAIL_HAS_ACCOUNT');
    expect((await admins.list()).map((operator) => operator.name)).toEqual(['Ana', 'Bruno']);
  });

  it('removes the new account when the operator cannot be saved', async () => {
    const failing = new InMemoryAdminRepository();
    failing.save = async () => {
      throw new Error('database down');
    };
    const deleted: string[] = [];
    const tracked: OperatorAccounts = {
      create: (email, password) => accounts.create(email, password),
      setPassword: (userId, password) => accounts.setPassword(userId, password),
      delete: async (userId) => {
        deleted.push(userId);
      },
    };

    await expect(
      new CreateOperator(failing, tracked, passwords).execute({
        email: 'd@example.com',
        name: 'D',
      }),
    ).rejects.toThrow('database down');
    expect(deleted).toHaveLength(1);
  });
});

describe('UpdateOperator', () => {
  it('renames and deactivates another operator, and reactivates them', async () => {
    const update = new UpdateOperator(admins);

    await update.execute({
      userId: bruno.userId,
      byUserId: ana.userId,
      name: 'Bruno S.',
      active: false,
    });
    expect(await admins.findByUserId(bruno.userId)).toMatchObject({
      name: 'Bruno S.',
      active: false,
    });

    await update.execute({
      userId: bruno.userId,
      byUserId: ana.userId,
      name: 'Bruno S.',
      active: true,
    });
    expect((await admins.findByUserId(bruno.userId))?.active).toBe(true);
  });

  it('lets an operator rename themselves but not deactivate themselves', async () => {
    const update = new UpdateOperator(admins);

    const renamed = await update.execute({
      userId: ana.userId,
      byUserId: ana.userId,
      name: 'Ana Lima',
      active: true,
    });
    const deactivated = await update.execute({
      userId: ana.userId,
      byUserId: ana.userId,
      name: 'Ana Lima',
      active: false,
    });

    expect(renamed.ok).toBe(true);
    expect(deactivated.ok || deactivated.error.code).toBe('CANNOT_DEACTIVATE_SELF');
    expect(await admins.findByUserId(ana.userId)).toMatchObject({ name: 'Ana Lima', active: true });
  });

  it('reports an unknown operator', async () => {
    const result = await new UpdateOperator(admins).execute({
      userId: '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e99',
      byUserId: ana.userId,
      name: 'X',
      active: true,
    });
    expect(result.ok || result.error.code).toBe('OPERATOR_NOT_FOUND');
  });
});

describe('ResetOperatorPassword', () => {
  it('gives an operator a new temporary password', async () => {
    const result = await new ResetOperatorPassword(admins, accounts, passwords).execute({
      userId: bruno.userId,
    });

    expect(result).toEqual({
      ok: true,
      value: { userId: bruno.userId, temporaryPassword: 'temporary-password-1' },
    });
    expect(accounts.passwords.get(bruno.userId)).toBe('temporary-password-1');
  });

  it('never touches an account that is not an operator', async () => {
    const userId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e03';
    const result = await new ResetOperatorPassword(admins, accounts, passwords).execute({ userId });

    expect(result.ok || result.error.code).toBe('OPERATOR_NOT_FOUND');
    expect(accounts.passwords.has(userId)).toBe(false);
  });
});
