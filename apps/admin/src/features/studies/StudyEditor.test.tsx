import type { AdminSign, AdminStudy, AdminStudyGroup } from '@libras/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSigns } from '@/features/signs/signsApi';

import { createStudy, getStudy, getStudyGroups, updateStudy } from './studiesApi';
import { StudyEditor } from './StudyEditor';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('./studiesApi', () => ({
  getStudyGroups: vi.fn(),
  getStudy: vi.fn(),
  createStudy: vi.fn(),
  updateStudy: vi.fn(),
}));
vi.mock('@/features/signs/signsApi', () => ({ getSigns: vi.fn() }));

const groups: AdminStudyGroup[] = [
  { id: 'iniciante', title: 'Primeiros passos', studies: [] },
  { id: 'cotidiano', title: 'Cotidiano', studies: [] },
];

const letterA: AdminSign = {
  id: 'letter-a',
  label: 'A',
  imageUrls: ['https://x.test/a.webp'],
  alt: 'Mão fechada',
  description: null,
  exerciseCount: 0,
  studyCount: 1,
};

const alphabet: AdminStudy = {
  id: 'alfabeto',
  groupId: 'iniciante',
  title: 'Alfabeto manual',
  visible: true,
  description: 'As 26 letras.',
  pages: [
    {
      id: 'letras',
      title: 'Letras',
      blocks: [
        { type: 'text', body: 'Olhe cada imagem.' },
        { type: 'sign', label: 'B', images: [{ url: 'https://x.test/b.webp', alt: 'Mão' }] },
      ],
    },
  ],
};

beforeEach(() => {
  push.mockReset();
  vi.mocked(getStudyGroups).mockReset().mockResolvedValue(groups);
  vi.mocked(getSigns).mockReset().mockResolvedValue([letterA]);
  vi.mocked(getStudy).mockReset().mockResolvedValue(alphabet);
  vi.mocked(createStudy).mockReset().mockResolvedValue('study-1');
  vi.mocked(updateStudy).mockReset().mockResolvedValue();
});

const saveButton = () => screen.getByRole('button', { name: 'Salvar estudo' }) as HTMLButtonElement;

describe('StudyEditor', () => {
  it('creates a study with a heading and a sign block', async () => {
    const user = userEvent.setup();
    render(<StudyEditor groupId="cotidiano" />);

    await user.type(await screen.findByLabelText('Título'), 'Vogais');
    await user.type(screen.getByLabelText(/^Descrição/), 'As cinco vogais.');
    await user.type(screen.getByLabelText('Título da página 1'), 'A');
    const page = screen.getByRole('region', { name: 'Página 1' });
    await user.type(within(page).getByLabelText('Texto 1'), 'Comece pela letra A.');
    expect(saveButton().disabled).toBe(false);

    await user.click(within(page).getByRole('button', { name: '+ Sinal' }));
    expect(saveButton().disabled).toBe(true);
    await user.type(within(page).getByRole('searchbox'), 'a');
    await user.click(within(page).getByRole('button', { name: '+ A' }));
    await user.click(saveButton());

    expect(createStudy).toHaveBeenCalledWith({
      groupId: 'cotidiano',
      title: 'Vogais',
      description: 'As cinco vogais.',
      pages: [
        {
          title: 'A',
          blocks: [
            { type: 'text', body: 'Comece pela letra A.' },
            { type: 'sign', signId: 'letter-a' },
          ],
        },
      ],
    });
    expect(push).toHaveBeenCalledWith('/estudos');
  });

  it('asks to pick again a sign block that is not linked to a sign', async () => {
    const user = userEvent.setup();
    render(<StudyEditor studyId="alfabeto" />);

    expect(await screen.findByText(/mostrava “B”/)).toBeTruthy();
    expect(saveButton().disabled).toBe(true);

    await user.type(screen.getByRole('searchbox'), 'a');
    await user.click(screen.getByRole('button', { name: '+ A' }));
    await user.selectOptions(screen.getByLabelText(/^Grupo/), 'cotidiano');
    await user.click(saveButton());

    expect(updateStudy).toHaveBeenCalledWith('alfabeto', {
      groupId: 'cotidiano',
      title: 'Alfabeto manual',
      description: 'As 26 letras.',
      pages: [
        {
          id: 'letras',
          title: 'Letras',
          blocks: [
            { type: 'text', body: 'Olhe cada imagem.' },
            { type: 'sign', signId: 'letter-a' },
          ],
        },
      ],
    });
  });

  it('adds, moves and removes pages', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<StudyEditor studyId="alfabeto" />);

    await user.click(await screen.findByRole('button', { name: '+ Nova página' }));
    await user.type(screen.getByLabelText('Título da página 2'), 'Dicas');
    await user.click(screen.getByRole('button', { name: 'Subir página 2' }));
    expect((screen.getByLabelText('Título da página 1') as HTMLInputElement).value).toBe('Dicas');

    const second = screen.getByRole('region', { name: 'Página 2' });
    await user.click(within(second).getByRole('button', { name: 'Remover página' }));
    expect(screen.queryByRole('region', { name: 'Página 2' })).toBeNull();
  });

  it('previews what is in the form, saved or not', async () => {
    const user = userEvent.setup();
    render(<StudyEditor studyId="alfabeto" />);
    await user.click(await screen.findByRole('button', { name: 'Pré-visualizar' }));
    const phone = within(screen.getByRole('complementary', { name: 'Prévia do estudo' }));

    expect(phone.getByText('Olhe cada imagem.')).toBeTruthy();
    expect(phone.getByText('Sinal ainda não escolhido')).toBeTruthy();

    await user.type(screen.getByRole('searchbox'), 'a');
    await user.click(screen.getByRole('button', { name: '+ A' }));
    expect(phone.queryByText('Sinal ainda não escolhido')).toBeNull();
    expect(phone.getByText('A')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '+ Nova página' }));
    await user.type(screen.getByLabelText('Título da página 2'), 'Dicas');
    await user.click(phone.getByRole('button', { name: 'Próxima' }));
    expect(phone.getByText('Dicas')).toBeTruthy();
    expect(updateStudy).not.toHaveBeenCalled();
  });
});
