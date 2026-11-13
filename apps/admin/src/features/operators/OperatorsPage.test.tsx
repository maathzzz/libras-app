import type { AdminOperator } from '@libras/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api/client';

import {
  createOperator,
  getOperators,
  resetOperatorPassword,
  updateOperator,
} from './operatorsApi';
import { OperatorsPage } from './OperatorsPage';

vi.mock('@/features/auth/AdminGate', () => ({
  useAdmin: () => ({ name: 'Ana', email: 'ana@example.com' }),
}));
vi.mock('./operatorsApi', () => ({
  getOperators: vi.fn(),
  createOperator: vi.fn(),
  updateOperator: vi.fn(),
  resetOperatorPassword: vi.fn(),
}));

const operators: AdminOperator[] = [
  {
    userId: '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01',
    email: 'ana@example.com',
    name: 'Ana',
    active: true,
  },
  {
    userId: '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e02',
    email: 'bruno@example.com',
    name: 'Bruno',
    active: true,
  },
];

beforeEach(() => {
  vi.mocked(getOperators).mockReset().mockResolvedValue(operators);
  vi.mocked(createOperator).mockReset().mockResolvedValue('temporary-password-1');
  vi.mocked(updateOperator).mockReset().mockResolvedValue();
  vi.mocked(resetOperatorPassword).mockReset().mockResolvedValue('temporary-password-2');
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

const rowOf = async (name: string) => {
  const row = (await screen.findByText(name)).closest('li');
  if (!row) throw new Error(`${name} not rendered`);
  return within(row);
};

describe('OperatorsPage', () => {
  it('lists the operators and does not offer to deactivate yourself', async () => {
    render(<OperatorsPage />);

    const self = await rowOf('Ana');
    expect(self.getByText('(você)')).toBeTruthy();
    expect(self.queryByRole('button', { name: 'Desativar' })).toBeNull();
    expect((await rowOf('Bruno')).getByRole('button', { name: 'Desativar' })).toBeTruthy();
  });

  it('creates an operator and shows the temporary password once', async () => {
    const user = userEvent.setup();
    render(<OperatorsPage />);
    const form = within(await screen.findByRole('form', { name: 'Novo operador' }));

    await user.type(form.getByLabelText(/^E-mail/), 'Carla+CMS@example.com');
    await user.type(form.getByLabelText('Nome'), 'Carla');
    await user.click(form.getByRole('button', { name: 'Criar operador' }));

    expect(createOperator).toHaveBeenCalledWith({ email: 'carla+cms@example.com', name: 'Carla' });
    const notice = within(screen.getByRole('status'));
    expect(notice.getByText('temporary-password-1')).toBeTruthy();
    await user.click(notice.getByRole('button', { name: 'Já anotei' }));
    expect(screen.queryByText('temporary-password-1')).toBeNull();
  });

  it('keeps the fields when the e-mail already has an account', async () => {
    vi.mocked(createOperator).mockRejectedValue(
      new ApiError('request', 'taken', 409, 'EMAIL_HAS_ACCOUNT'),
    );
    const user = userEvent.setup();
    render(<OperatorsPage />);
    const form = within(await screen.findByRole('form', { name: 'Novo operador' }));

    await user.type(form.getByLabelText(/^E-mail/), 'aluno@example.com');
    await user.type(form.getByLabelText('Nome'), 'Aluno');
    await user.click(form.getByRole('button', { name: 'Criar operador' }));

    expect((await screen.findByRole('alert')).textContent).toContain('já tem uma conta');
    expect((form.getByLabelText(/^E-mail/) as HTMLInputElement).value).toBe('aluno@example.com');
  });

  it('deactivates another operator after confirming', async () => {
    const user = userEvent.setup();
    render(<OperatorsPage />);
    await user.click((await rowOf('Bruno')).getByRole('button', { name: 'Desativar' }));

    expect(updateOperator).toHaveBeenCalledWith(operators[1]?.userId, {
      name: 'Bruno',
      active: false,
    });
    expect(getOperators).toHaveBeenCalledTimes(2);
  });

  it('gives an operator a new password and shows it', async () => {
    const user = userEvent.setup();
    render(<OperatorsPage />);
    await user.click((await rowOf('Bruno')).getByRole('button', { name: 'Nova senha' }));

    expect(resetOperatorPassword).toHaveBeenCalledWith(operators[1]?.userId);
    expect(
      within(await screen.findByRole('status')).getByText('temporary-password-2'),
    ).toBeTruthy();
  });
});
