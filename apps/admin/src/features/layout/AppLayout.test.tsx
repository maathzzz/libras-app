import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdmin } from '@/features/auth/AdminGate';
import { signOut } from '@/features/auth/session';

import { AppLayout } from './AppLayout';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/features/auth/AdminGate', () => ({ useAdmin: vi.fn() }));
vi.mock('@/features/auth/session', () => ({ signOut: vi.fn() }));

beforeEach(() => {
  vi.mocked(useAdmin).mockReturnValue({ name: 'Ana', email: 'ana@example.com' });
  vi.mocked(signOut).mockReset();
});

describe('AppLayout', () => {
  it('marks the current section and shows the page content', () => {
    render(<AppLayout>Conteúdo</AppLayout>);

    expect(screen.getByRole('link', { name: 'Início' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Conteúdo')).toBeTruthy();
  });

  it('links every section', () => {
    render(<AppLayout>Conteúdo</AppLayout>);

    expect(screen.getByRole('link', { name: 'Sinais' }).getAttribute('href')).toBe('/sinais');
    expect(screen.getByRole('link', { name: 'Estudos' }).getAttribute('href')).toBe('/estudos');
    expect(screen.getByRole('link', { name: 'Operadores' }).getAttribute('href')).toBe(
      '/operadores',
    );
    expect(screen.getByRole('link', { name: 'Minha senha' }).getAttribute('href')).toBe(
      '/conta/senha',
    );
  });

  it('shows the operator and signs out', async () => {
    render(<AppLayout>Conteúdo</AppLayout>);

    expect(screen.getByText('ana@example.com')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
