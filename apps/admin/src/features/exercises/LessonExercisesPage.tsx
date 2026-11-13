'use client';

import type { AdminExercise, AdminSign, SaveExerciseRequest } from '@libras/contracts';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { moved } from '@/features/curriculum/curriculumApi';
import { getSigns } from '@/features/signs/signsApi';
import { SignThumb } from '@/features/signs/SignThumb';
import { errorMessage } from '@/shared/api/errorMessage';
import { useApiData } from '@/shared/api/useApiData';
import { Button, Card, DraftNotice, ErrorBanner, LoadingText } from '@/shared/ui';

import { ExerciseForm } from './ExerciseForm';
import {
  createExercise,
  deleteExercise,
  getLessonExercises,
  reorderExercises,
  updateExercise,
} from './exercisesApi';
import { exerciseTypes } from './exerciseTypes';

// Which form is open: none, a new exercise or the one with this id.
type Editing = null | 'new' | string;

const backLink = (
  <Link href="/trilhas" className="text-accent-dark underline-offset-2 hover:underline">
    ← Trilhas e lições
  </Link>
);

function OptionChip({ sign, correct }: { sign: AdminSign | undefined; correct: boolean }) {
  const label = sign?.label ?? 'sinal excluído';
  return (
    <li
      className={`flex items-center gap-2 rounded-sm px-2 py-1 ${
        correct ? 'bg-success-soft text-success-dark' : 'bg-surface-subtle'
      }`}
    >
      {sign?.imageUrls[0] && <SignThumb url={sign.imageUrls[0]} alt={sign.alt} size="sm" />}
      <span className="font-semibold">{label}</span>
      {correct && <span className="text-[12px] font-bold">✓ certa</span>}
    </li>
  );
}

function ExerciseCard({
  exercise,
  number,
  signsById,
  isFirst,
  isLast,
  onEdit,
  onMove,
  onDelete,
}: {
  exercise: AdminExercise;
  number: number;
  signsById: ReadonlyMap<string, AdminSign>;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onMove: (step: -1 | 1) => void;
  onDelete: () => void;
}) {
  const correct = signsById.get(exercise.correctSignId);
  const answer = correct?.label ?? 'sinal excluído';
  const prompt =
    exercise.type === 'sign_to_word'
      ? `Mostra o sinal de “${answer}” e pede o nome`
      : `Mostra a palavra “${answer}” e pede o sinal`;

  return (
    <li>
      <Card className="grid gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="grid gap-0.5">
            <h2 className="font-bold">
              {number}. {exerciseTypes[exercise.type].name}
            </h2>
            <p className="text-[13px] text-text-muted">{prompt}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Subir exercício ${number}`}
              disabled={isFirst}
              onClick={() => onMove(-1)}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Descer exercício ${number}`}
              disabled={isLast}
              onClick={() => onMove(1)}
            >
              ↓
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Editar
            </Button>
            <Button variant="danger" size="sm" onClick={onDelete}>
              Excluir
            </Button>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label={`Opções do exercício ${number}`}>
          {exercise.signIds.map((id) => (
            <OptionChip key={id} sign={signsById.get(id)} correct={id === exercise.correctSignId} />
          ))}
        </ul>
      </Card>
    </li>
  );
}

export function LessonExercisesPage({ lessonId }: { lessonId: string }) {
  const load = useCallback(
    () => Promise.all([getLessonExercises(lessonId), getSigns()] as const),
    [lessonId],
  );
  const { state, reload } = useApiData(load);
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);

  // The screen is reloaded after every change, also on failure: an error usually means it
  // was out of date.
  const run = useCallback(
    async (change: () => Promise<unknown>) => {
      setError(null);
      try {
        await change();
      } catch (failure) {
        setError(errorMessage(failure));
      } finally {
        reload();
      }
    },
    [reload],
  );

  // The form shows its own error and stays open when saving fails.
  async function save(id: Editing, exercise: SaveExerciseRequest) {
    try {
      if (id === 'new') await createExercise(lessonId, exercise);
      else if (id) await updateExercise(id, exercise);
      setEditing(null);
    } finally {
      reload();
    }
  }

  if (state.status === 'loading') {
    return (
      <>
        {backLink}
        <LoadingText />
      </>
    );
  }
  if (state.status === 'error') {
    return (
      <>
        {backLink}
        <ErrorBanner
          action={
            <Button variant="secondary" size="sm" onClick={reload}>
              Tentar de novo
            </Button>
          }
        >
          {errorMessage(state.error)}
        </ErrorBanner>
      </>
    );
  }

  const [{ lesson, exercises }, signs] = state.data;
  const signsById = new Map(signs.map((sign) => [sign.id, sign]));
  const ids = exercises.map((exercise) => exercise.id);

  function confirmDelete(number: number, id: string) {
    const question = `Excluir o exercício ${number} do rascunho?\n\nOs alunos continuam vendo o conteúdo publicado até a próxima publicação.`;
    if (window.confirm(question)) void run(() => deleteExercise(id));
  }

  return (
    <>
      {backLink}
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <p className="text-text-muted">Exercícios da lição, na ordem em que o aluno os faz.</p>
      </div>
      <DraftNotice />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {exercises.length === 0 && editing !== 'new' && (
        <p className="text-text-muted">
          Nenhum exercício ainda. A lição precisa de ao menos um para ser feita no app.
        </p>
      )}

      <ol className="grid gap-3">
        {exercises.map((exercise, index) =>
          editing === exercise.id ? (
            <li key={exercise.id}>
              <ExerciseForm
                signs={signs}
                initial={exercise}
                onSave={(changes) => save(exercise.id, changes)}
                onCancel={() => setEditing(null)}
              />
            </li>
          ) : (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              number={index + 1}
              signsById={signsById}
              isFirst={index === 0}
              isLast={index === exercises.length - 1}
              onEdit={() => setEditing(exercise.id)}
              onMove={(step) =>
                void run(() => reorderExercises(lessonId, moved(ids, exercise.id, step)))
              }
              onDelete={() => confirmDelete(index + 1, exercise.id)}
            />
          ),
        )}
      </ol>

      {editing === 'new' ? (
        <div className="grid gap-2">
          <h2 className="text-lg font-bold">Novo exercício</h2>
          <ExerciseForm
            signs={signs}
            onSave={(exercise) => save('new', exercise)}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <Button variant="primary" className="justify-self-start" onClick={() => setEditing('new')}>
          + Novo exercício
        </Button>
      )}
    </>
  );
}
