import type * as CurriculumApiModule from './curriculumApi';
import type { AdminTrail } from '@libras/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api/client';

import { createItem, deleteItem, getTrails, reorderItems, setVisibility } from './curriculumApi';
import { TrailsPage } from './TrailsPage';

vi.mock('./curriculumApi', async (importOriginal) => ({
  ...(await importOriginal<typeof CurriculumApiModule>()),
  getTrails: vi.fn(),
  createItem: vi.fn(),
  renameItem: vi.fn(),
  deleteItem: vi.fn(),
  reorderItems: vi.fn(),
  setVisibility: vi.fn(),
}));

const trails: AdminTrail[] = [
  {
    id: 'basico',
    title: 'Libras básico',
    visible: true,
    units: [
      {
        id: 'alfabeto',
        title: 'Alfabeto',
        visible: true,
        lessons: [
          { id: 'a-e', title: 'A a E', visible: true, exerciseCount: 10 },
          { id: 'f-j', title: 'F a J', visible: true, exerciseCount: 1 },
        ],
      },
      { id: 'saudacoes', title: 'Saudações', visible: true, lessons: [] },
    ],
  },
];

beforeEach(() => {
  vi.mocked(getTrails).mockReset().mockResolvedValue(trails);
  vi.mocked(createItem).mockReset().mockResolvedValue('lesson-1');
  vi.mocked(deleteItem).mockReset().mockResolvedValue();
  vi.mocked(reorderItems).mockReset().mockResolvedValue();
  vi.mocked(setVisibility).mockReset().mockResolvedValue();
});

describe('TrailsPage', () => {
  it('shows the outline with counts and the trail shown in the app', async () => {
    render(<TrailsPage />);

    expect(await screen.findByRole('heading', { name: 'Libras básico' })).toBeTruthy();
    expect(screen.getByText('exibida no app')).toBeTruthy();
    expect(screen.getByText('10 exercícios')).toBeTruthy();
    expect(screen.getByText('1 exercício')).toBeTruthy();
    expect(screen.getByText(/Sem lições/)).toBeTruthy();
  });

  it('adds a lesson to its module and reloads', async () => {
    render(<TrailsPage />);
    const unit = (await screen.findByRole('heading', { name: 'Alfabeto' })).closest('li');
    if (!unit) throw new Error('unit not rendered');

    await userEvent.click(within(unit).getByRole('button', { name: '+ Nova lição' }));
    await userEvent.type(within(unit).getByRole('textbox', { name: 'Nova lição' }), 'K a O');
    await userEvent.click(within(unit).getByRole('button', { name: 'Adicionar' }));

    expect(createItem).toHaveBeenCalledWith({ level: 'lesson', parentId: 'alfabeto' }, 'K a O');
    expect(getTrails).toHaveBeenCalledTimes(2);
  });

  it('moves a lesson by sending the whole new order', async () => {
    render(<TrailsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Descer “A a E”' }));

    expect(reorderItems).toHaveBeenCalledWith({ level: 'lesson', parentId: 'alfabeto' }, [
      'f-j',
      'a-e',
    ]);
  });

  it('asks before deleting and shows what goes with it', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<TrailsPage />);
    const unit = (await screen.findByRole('heading', { name: 'Alfabeto' })).closest('li');
    if (!unit) throw new Error('unit not rendered');

    await userEvent.click(
      within(unit).getAllByRole('button', { name: 'Excluir' })[0] as HTMLElement,
    );

    expect(confirm.mock.calls[0]?.[0]).toMatch(/Excluir o módulo “Alfabeto”[\s\S]*2 lições/);
    expect(deleteItem).toHaveBeenCalledWith('unit', 'alfabeto');
    confirm.mockRestore();
  });

  it('explains a stale order and reloads', async () => {
    vi.mocked(reorderItems).mockRejectedValue(
      new ApiError('request', 'stale', 422, 'INVALID_ORDER'),
    );
    render(<TrailsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Descer “A a E”' }));

    expect(await screen.findByText(/A lista mudou enquanto você editava/)).toBeTruthy();
    expect(getTrails).toHaveBeenCalledTimes(2);
  });

  it('hides a lesson and explains a visible lesson without exercises', async () => {
    vi.mocked(getTrails).mockResolvedValue([
      {
        id: 'basico',
        title: 'Libras básico',
        visible: true,
        units: [
          {
            id: 'alfabeto',
            title: 'Alfabeto',
            visible: true,
            lessons: [
              { id: 'a-e', title: 'A a E', visible: true, exerciseCount: 10 },
              { id: 'vazia', title: 'Vazia', visible: true, exerciseCount: 0 },
            ],
          },
        ],
      },
    ]);
    const user = userEvent.setup();
    render(<TrailsPage />);

    expect(await screen.findByText(/sem exercícios: fica fora do app/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Ocultar “A a E” no app' }));

    expect(setVisibility).toHaveBeenCalledWith('lesson', 'a-e', false);
    expect(getTrails).toHaveBeenCalledTimes(2);
  });

  it('explains why a lesson that learners did is not deleted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(deleteItem).mockRejectedValue(
      new ApiError('request', 'progress', 409, 'CONTENT_HAS_PROGRESS'),
    );
    const user = userEvent.setup();
    render(<TrailsPage />);
    const lesson = (await screen.findByText('A a E')).closest('li');
    if (!lesson) throw new Error('lesson not rendered');
    await user.click(within(lesson).getByRole('button', { name: 'Excluir' }));

    expect((await screen.findByRole('alert')).textContent).toContain('oculte');
  });
});
