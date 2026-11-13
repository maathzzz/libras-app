import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChangePasswordPage } from './ChangePasswordPage';
import { changePassword } from './session';

vi.mock('./AdminGate', () => ({ useAdmin: () => ({ name: 'Ana', email: 'ana@example.com' }) }));
vi.mock('./session', () => ({ changePassword: vi.fn(), MIN_PASSWORD_LENGTH: 10 }));

beforeEach(() => {
  vi.mocked(changePassword).mockReset().mockResolvedValue('ok');
});

async function fill(current: string, next: string, repeated = next) {
  const user = userEvent.setup();
  render(<ChangePasswordPage />);
  await user.type(screen.getByLabelText('Senha atual'), current);
  await user.type(screen.getByLabelText(/^Nova senha/), next);
  await user.type(screen.getByLabelText('Repita a nova senha'), repeated);
  return { user, save: screen.getByRole('button', { name: 'Trocar senha' }) as HTMLButtonElement };
}

describe('ChangePasswordPage', () => {
  it('changes the password with the current one', async () => {
    const { user, save } = await fill('temporaria-1', 'minha-senha-nova');
    await user.click(save);

    expect(changePassword).toHaveBeenCalledWith(
      'ana@example.com',
      'temporaria-1',
      'minha-senha-nova',
    );
    expect((await screen.findByRole('status')).textContent).toContain('Senha trocada');
  });

  it('waits for a long enough password typed twice the same', async () => {
    expect((await fill('x', 'curta')).save.disabled).toBe(true);
  });

  it('says so when the passwords differ', async () => {
    const { save } = await fill('x', 'minha-senha-nova', 'outra-senha-nova');

    expect(save.disabled).toBe(true);
    expect(screen.getByText('As senhas não são iguais.')).toBeTruthy();
  });

  it('explains a wrong current password', async () => {
    vi.mocked(changePassword).mockResolvedValue('wrongCurrent');
    const { user, save } = await fill('errada', 'minha-senha-nova');
    await user.click(save);

    expect((await screen.findByRole('alert')).textContent).toContain('não confere');
  });
});
