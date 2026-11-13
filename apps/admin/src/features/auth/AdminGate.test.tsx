import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api/client';

import { getAdminMe } from './adminApi';
import { AdminGate, useAdmin } from './AdminGate';
import { signOut, useSession, type SessionState } from './session';

vi.mock('./session', () => ({ useSession: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));
vi.mock('./adminApi', () => ({ getAdminMe: vi.fn() }));

const sessionMock = vi.mocked(useSession);
const getAdminMeMock = vi.mocked(getAdminMe);

const signedIn: SessionState = { status: 'signedIn', userId: 'user-1', email: 'ana@example.com' };

function Greeting() {
  return <p>{`Olá, ${useAdmin().name}`}</p>;
}

const renderGate = () =>
  render(
    <AdminGate>
      <Greeting />
    </AdminGate>,
  );

beforeEach(() => {
  sessionMock.mockReset();
  getAdminMeMock.mockReset();
  vi.mocked(signOut).mockReset();
});

describe('AdminGate', () => {
  it('shows the login when signed out', () => {
    sessionMock.mockReturnValue({ status: 'signedOut' });

    renderGate();

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
    expect(getAdminMeMock).not.toHaveBeenCalled();
  });

  it('lets an active operator in', async () => {
    sessionMock.mockReturnValue(signedIn);
    getAdminMeMock.mockResolvedValue({ name: 'Ana', email: 'ana@example.com' });

    renderGate();

    expect(await screen.findByText('Olá, Ana')).toBeTruthy();
  });

  it('keeps a learner out and offers to sign out', async () => {
    sessionMock.mockReturnValue(signedIn);
    getAdminMeMock.mockRejectedValue(new ApiError('request', 'Not an operator', 403, 'NOT_ADMIN'));

    renderGate();

    expect(await screen.findByText('Sem acesso ao CMS')).toBeTruthy();
    expect(screen.queryByText(/Olá/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('offers to try again when the BFF does not answer', async () => {
    sessionMock.mockReturnValue(signedIn);
    getAdminMeMock
      .mockRejectedValueOnce(new ApiError('network', 'Sem resposta do servidor'))
      .mockResolvedValueOnce({ name: 'Ana', email: 'ana@example.com' });

    renderGate();
    await userEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Olá, Ana')).toBeTruthy();
    expect(getAdminMeMock).toHaveBeenCalledTimes(2);
  });
});
