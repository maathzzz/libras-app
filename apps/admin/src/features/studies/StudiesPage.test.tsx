import type { AdminStudyGroup } from '@libras/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api/client';

import { StudiesPage } from './StudiesPage';
import {
  createStudyGroup,
  deleteStudy,
  deleteStudyGroup,
  getStudyGroups,
  reorderStudies,
} from './studiesApi';

vi.mock('./studiesApi', () => ({
  getStudyGroups: vi.fn(),
  createStudyGroup: vi.fn(),
  renameStudyGroup: vi.fn(),
  deleteStudyGroup: vi.fn(),
  reorderStudyGroups: vi.fn(),
  reorderStudies: vi.fn(),
  deleteStudy: vi.fn(),
}));

const groups: AdminStudyGroup[] = [
  {
    id: 'iniciante',
    title: 'Primeiros passos',
    studies: [
      { id: 'alfabeto', title: 'Alfabeto manual', description: 'As 26 letras.', pageCount: 6 },
      { id: 'numeros', title: 'Números', description: 'De 0 a 10.', pageCount: 1 },
    ],
  },
  { id: 'vazio', title: 'Cotidiano', studies: [] },
];

beforeEach(() => {
  vi.mocked(getStudyGroups).mockReset().mockResolvedValue(groups);
  vi.mocked(createStudyGroup).mockReset().mockResolvedValue('study-group-1');
  vi.mocked(deleteStudyGroup).mockReset().mockResolvedValue();
  vi.mocked(deleteStudy).mockReset().mockResolvedValue();
  vi.mocked(reorderStudies).mockReset().mockResolvedValue();
});

describe('StudiesPage', () => {
  it('lists groups with their studies, empty ones too', async () => {
    render(<StudiesPage />);

    expect(await screen.findByRole('heading', { name: 'Primeiros passos' })).toBeTruthy();
    expect(screen.getByText('Alfabeto manual')).toBeTruthy();
    expect(screen.getByText(/6 páginas/)).toBeTruthy();
    expect(screen.getByText(/Sem estudos/)).toBeTruthy();
  });

  it('creates a group and reloads', async () => {
    const user = userEvent.setup();
    render(<StudiesPage />);
    await user.click(await screen.findByRole('button', { name: '+ Novo grupo' }));
    await user.type(screen.getByRole('textbox'), 'Família');
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(createStudyGroup).toHaveBeenCalledWith('Família');
    expect(getStudyGroups).toHaveBeenCalledTimes(2);
  });

  it('moves a study down in its group', async () => {
    const user = userEvent.setup();
    render(<StudiesPage />);
    await user.click(await screen.findByRole('button', { name: 'Descer “Alfabeto manual”' }));

    expect(reorderStudies).toHaveBeenCalledWith('iniciante', ['numeros', 'alfabeto']);
  });

  it('explains why a group with studies is not deleted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(deleteStudyGroup).mockRejectedValue(
      new ApiError('request', 'not empty', 409, 'STUDY_GROUP_NOT_EMPTY'),
    );
    const user = userEvent.setup();
    render(<StudiesPage />);
    const group = (await screen.findByRole('heading', { name: 'Primeiros passos' })).closest(
      'section',
    );
    if (!group) throw new Error('group not rendered');
    await user.click(within(group).getAllByRole('button', { name: 'Excluir' })[0] as HTMLElement);

    expect(deleteStudyGroup).toHaveBeenCalledWith('iniciante');
    expect((await screen.findByRole('alert')).textContent).toContain('ainda tem estudos');
  });

  it('deletes a study after confirming', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<StudiesPage />);
    const row = (await screen.findByText('Números')).closest('li');
    if (!row) throw new Error('study not rendered');
    await user.click(within(row).getByRole('button', { name: 'Excluir' }));

    expect(deleteStudy).toHaveBeenCalledWith('numeros');
  });
});
