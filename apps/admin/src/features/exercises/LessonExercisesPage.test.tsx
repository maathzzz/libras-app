import type { AdminSign } from '@libras/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSigns } from '@/features/signs/signsApi';
import { ApiError } from '@/shared/api/client';

import {
  createExercise,
  deleteExercise,
  getLessonExercises,
  reorderExercises,
  updateExercise,
} from './exercisesApi';
import { LessonExercisesPage } from './LessonExercisesPage';

vi.mock('./exercisesApi', () => ({
  getLessonExercises: vi.fn(),
  createExercise: vi.fn(),
  updateExercise: vi.fn(),
  deleteExercise: vi.fn(),
  reorderExercises: vi.fn(),
}));
vi.mock('@/features/signs/signsApi', () => ({ getSigns: vi.fn() }));

const sign = (id: string, label: string): AdminSign => ({
  id,
  label,
  imageUrls: [`https://x.test/${id}.webp`],
  alt: 'Mão de teste',
  description: null,
  exerciseCount: 1,
  studyCount: 0,
});

const image = (id: string) => ({ url: `https://x.test/${id}.webp`, alt: 'Mão de teste' });

const signs = [sign('a', 'A'), sign('b', 'B'), sign('c', 'C'), sign('a2', 'a')];

beforeEach(() => {
  vi.mocked(getSigns).mockReset().mockResolvedValue(signs);
  vi.mocked(getLessonExercises)
    .mockReset()
    .mockResolvedValue({
      lesson: { id: 'vogais', title: 'Vogais' },
      exercises: [
        {
          id: 'ex-1',
          type: 'sign_to_word',
          signIds: ['a', 'b'],
          correctSignId: 'a',
          payload: {
            id: 'ex-1',
            type: 'sign_to_word',
            images: [image('a')],
            options: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ],
            correctOptionId: 'a',
          },
        },
        {
          id: 'ex-2',
          type: 'word_to_sign',
          signIds: ['b', 'c'],
          correctSignId: 'c',
          payload: {
            id: 'ex-2',
            type: 'word_to_sign',
            word: 'C',
            options: [
              { id: 'b', images: [image('b')] },
              { id: 'c', images: [image('c')] },
            ],
            correctOptionId: 'c',
          },
        },
      ],
    });
  vi.mocked(createExercise).mockReset().mockResolvedValue('exercise-1');
  vi.mocked(updateExercise).mockReset().mockResolvedValue();
  vi.mocked(deleteExercise).mockReset().mockResolvedValue();
  vi.mocked(reorderExercises).mockReset().mockResolvedValue();
});

async function openNewForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '+ Novo exercício' }));
  return screen.getByRole('form', { name: 'Exercício' });
}

async function addSign(user: ReturnType<typeof userEvent.setup>, form: HTMLElement, label: string) {
  await user.type(within(form).getByRole('searchbox'), label);
  await user.click(within(form).getByRole('button', { name: `+ ${label}` }));
}

const saveButton = (form: HTMLElement) =>
  within(form).getByRole('button', { name: 'Salvar exercício' }) as HTMLButtonElement;

describe('LessonExercisesPage', () => {
  it('lists the exercises with their type and the right answer', async () => {
    render(<LessonExercisesPage lessonId="vogais" />);

    expect(await screen.findByRole('heading', { name: 'Vogais' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '1. Sinal → palavra' })).toBeTruthy();
    expect(screen.getByText('Mostra a palavra “C” e pede o sinal')).toBeTruthy();
    const options = screen.getByRole('list', { name: 'Opções do exercício 1' });
    expect(within(options).getByText('✓ certa').closest('li')?.textContent).toContain('A');
  });

  it('creates an exercise from searched signs', async () => {
    const user = userEvent.setup();
    render(<LessonExercisesPage lessonId="vogais" />);
    const form = await openNewForm(user);

    await user.click(within(form).getByLabelText(/Palavra → sinal/));
    await addSign(user, form, 'B');
    expect(saveButton(form).disabled).toBe(true);
    await addSign(user, form, 'C');
    await user.click(saveButton(form));

    expect(createExercise).toHaveBeenCalledWith('vogais', {
      type: 'word_to_sign',
      signIds: ['b', 'c'],
      correctSignId: 'b',
    });
    expect(getLessonExercises).toHaveBeenCalledTimes(2);
  });

  it('does not save options with the same name', async () => {
    const user = userEvent.setup();
    render(<LessonExercisesPage lessonId="vogais" />);
    const form = await openNewForm(user);

    await addSign(user, form, 'A');
    await addSign(user, form, 'a');

    expect(within(form).getByRole('alert').textContent).toContain('Mais de uma opção');
    expect(saveButton(form).disabled).toBe(true);
  });

  it('edits an exercise, changing the right answer', async () => {
    const user = userEvent.setup();
    render(<LessonExercisesPage lessonId="vogais" />);
    const [firstEdit] = await screen.findAllByRole('button', { name: 'Editar' });
    if (!firstEdit) throw new Error('no edit button');
    await user.click(firstEdit);

    const form = screen.getByRole('form', { name: 'Exercício' });
    const [, secondOption] = within(form).getAllByRole('radio', { name: 'Resposta certa' });
    if (!secondOption) throw new Error('no second option');
    await user.click(secondOption);
    await user.click(saveButton(form));

    expect(updateExercise).toHaveBeenCalledWith('ex-1', {
      type: 'sign_to_word',
      signIds: ['a', 'b'],
      correctSignId: 'b',
    });
  });

  it('moves an exercise down and warns when the list was stale', async () => {
    vi.mocked(reorderExercises).mockRejectedValue(
      new ApiError('request', 'stale', 422, 'INVALID_ORDER'),
    );
    const user = userEvent.setup();
    render(<LessonExercisesPage lessonId="vogais" />);
    await user.click(await screen.findByRole('button', { name: 'Descer exercício 1' }));

    expect(reorderExercises).toHaveBeenCalledWith('vogais', ['ex-2', 'ex-1']);
    expect((await screen.findByRole('alert')).textContent).toContain('A lista mudou');
  });

  it('deletes an exercise after confirming', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<LessonExercisesPage lessonId="vogais" />);
    const [, secondDelete] = await screen.findAllByRole('button', { name: 'Excluir' });
    if (!secondDelete) throw new Error('no delete button');
    await user.click(secondDelete);

    expect(deleteExercise).toHaveBeenCalledWith('ex-2');
  });

  it('plays the lesson in the preview without saving anything', async () => {
    const user = userEvent.setup();
    render(<LessonExercisesPage lessonId="vogais" />);
    await user.click(await screen.findByRole('button', { name: 'Pré-visualizar' }));

    const phone = screen.getByRole('figure');
    expect(within(phone).getByText('O que este sinal significa?')).toBeTruthy();
    const verify = within(phone).getByRole('button', { name: 'Verificar' }) as HTMLButtonElement;
    expect(verify.disabled).toBe(true);
    await user.click(within(phone).getByRole('button', { name: 'B' }));
    await user.click(verify);
    expect(within(phone).getByRole('status').textContent).toContain('Ainda não');

    await user.click(within(phone).getByRole('button', { name: 'Continuar' }));
    expect(within(phone).getByText(/Qual destes sinais significa/)).toBeTruthy();
    await user.click(within(phone).getByRole('button', { name: 'Opção 2' }));
    await user.click(within(phone).getByRole('button', { name: 'Verificar' }));
    expect(within(phone).getByRole('status').textContent).toContain('Isso!');
    await user.click(within(phone).getByRole('button', { name: 'Continuar' }));

    expect(within(phone).getByText('Lição concluída!')).toBeTruthy();
    expect(createExercise).not.toHaveBeenCalled();
  });
});
