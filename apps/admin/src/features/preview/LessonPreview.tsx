'use client';

import type { Exercise, SignImageSequence } from '@libras/contracts';
import { useState } from 'react';

import { SignThumb } from '@/features/signs/SignThumb';
import { Button } from '@/shared/ui';

import { PhoneFrame } from './PhoneFrame';

function Frames({ images, size }: { images: SignImageSequence; size: 'md' | 'lg' }) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {images.map((image, index) => (
        <SignThumb key={`${image.url}-${index}`} url={image.url} alt={image.alt} size={size} />
      ))}
    </div>
  );
}

const optionBase =
  'grid min-h-12 cursor-pointer place-items-center rounded-md bg-surface p-3 font-bold text-text shadow-[inset_0_0_0_2px_var(--color-border)] disabled:cursor-default';

function optionClass(id: string, chosen: string | null, correct: string, checked: boolean) {
  if (checked && id === correct) {
    return `${optionBase} bg-success-soft text-success-dark shadow-[inset_0_0_0_2px_var(--color-success)]`;
  }
  if (checked && id === chosen) {
    return `${optionBase} bg-danger-soft text-danger-dark shadow-[inset_0_0_0_2px_var(--color-danger)]`;
  }
  if (id === chosen) {
    return `${optionBase} bg-accent-soft shadow-[inset_0_0_0_2px_var(--color-accent)]`;
  }
  return optionBase;
}

function ExerciseScreen({
  exercise,
  chosen,
  checked,
  onChoose,
}: {
  exercise: Exercise;
  chosen: string | null;
  checked: boolean;
  onChoose: (id: string) => void;
}) {
  const classOf = (id: string) => optionClass(id, chosen, exercise.correctOptionId, checked);

  if (exercise.type === 'sign_to_word') {
    return (
      <>
        <div className="grid gap-1">
          <p className="text-[12px] font-bold tracking-wide text-text-muted uppercase">
            Reconheça o sinal
          </p>
          <p className="text-xl font-bold">O que este sinal significa?</p>
        </div>
        <div className="rounded-lg bg-accent-soft p-4">
          <Frames images={exercise.images} size="lg" />
        </div>
        <div className="grid gap-2">
          {exercise.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={classOf(option.id)}
              disabled={checked}
              onClick={() => onChoose(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="grid gap-1">
        <p className="text-[12px] font-bold tracking-wide text-text-muted uppercase">
          Escolha o sinal
        </p>
        <p className="text-xl font-bold">
          Qual destes sinais significa{' '}
          <span className="text-accent">{exercise.word.toLocaleUpperCase('pt-BR')}</span>?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {exercise.options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            aria-label={`Opção ${index + 1}`}
            className={classOf(option.id)}
            disabled={checked}
            onClick={() => onChoose(option.id)}
          >
            <Frames images={option.images} size="md" />
          </button>
        ))}
      </div>
    </>
  );
}

// Plays the lesson as the learner would: pick, check, see the verdict. Nothing is graded or
// saved; the BFF is never asked.
export function LessonPreview({ title, exercises }: { title: string; exercises: Exercise[] }) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const exercise = exercises[index];

  function restart() {
    setIndex(0);
    setChosen(null);
    setChecked(false);
  }

  function next() {
    setIndex((current) => current + 1);
    setChosen(null);
    setChecked(false);
  }

  return (
    <PhoneFrame title={title}>
      <div
        className="h-3 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-label="Progresso da lição"
        aria-valuemin={0}
        aria-valuemax={exercises.length}
        aria-valuenow={index}
      >
        <div
          className="h-full rounded-full bg-success"
          style={{ width: `${(index / Math.max(exercises.length, 1)) * 100}%` }}
        />
      </div>

      {exercise ? (
        <>
          <ExerciseScreen
            key={exercise.id}
            exercise={exercise}
            chosen={chosen}
            checked={checked}
            onChoose={setChosen}
          />
          {checked ? (
            <div
              role="status"
              className={`grid gap-2 rounded-md p-4 ${
                chosen === exercise.correctOptionId
                  ? 'bg-success-soft text-success-dark'
                  : 'bg-danger-soft text-danger-dark'
              }`}
            >
              <p className="text-lg font-bold">
                {chosen === exercise.correctOptionId ? 'Isso!' : 'Ainda não'}
              </p>
              <p>
                {chosen === exercise.correctOptionId
                  ? 'Muito bem, continue assim.'
                  : 'A resposta certa está marcada.'}
              </p>
              <Button variant="primary" onClick={next}>
                Continuar
              </Button>
            </div>
          ) : (
            <Button variant="primary" disabled={chosen === null} onClick={() => setChecked(true)}>
              Verificar
            </Button>
          )}
        </>
      ) : (
        <div className="grid gap-3 text-center">
          <p className="text-xl font-bold">Lição concluída!</p>
          <p className="text-text-muted">Na prévia nada é gravado: sem XP nem streak.</p>
          <Button variant="secondary" onClick={restart}>
            Recomeçar
          </Button>
        </div>
      )}
    </PhoneFrame>
  );
}
