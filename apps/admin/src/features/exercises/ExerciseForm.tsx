'use client';

import {
  AdminExerciseType,
  EXERCISE_MAX_OPTIONS,
  EXERCISE_MIN_OPTIONS,
  SaveExerciseRequest,
  type AdminExercise,
  type AdminSign,
} from '@libras/contracts';
import { useState, type FormEvent } from 'react';

import { SignSearch } from '@/features/signs/SignSearch';
import { SignThumb } from '@/features/signs/SignThumb';
import { errorMessage } from '@/shared/api/errorMessage';
import { Button, Card, ErrorBanner, hintClassName } from '@/shared/ui';

import { exerciseTypes } from './exerciseTypes';

interface ExerciseFormProps {
  signs: readonly AdminSign[];
  initial?: AdminExercise | undefined;
  onSave: (exercise: SaveExerciseRequest) => Promise<void>;
  onCancel: () => void;
}

function shuffled<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [next[index], next[other]] = [next[other] as T, next[index] as T];
  }
  return next;
}

// Labels that more than one chosen sign has: the learner could not tell those options apart.
function repeatedLabels(chosen: readonly AdminSign[]): string[] {
  const seen = new Map<string, string[]>();
  for (const sign of chosen) {
    const key = sign.label.toLocaleLowerCase('pt-BR');
    seen.set(key, [...(seen.get(key) ?? []), sign.label]);
  }
  return [...seen.values()].filter((labels) => labels.length > 1).map(([label]) => label ?? '');
}

export function ExerciseForm({ signs, initial, onSave, onCancel }: ExerciseFormProps) {
  const [type, setType] = useState<AdminExerciseType>(initial?.type ?? 'sign_to_word');
  const [signIds, setSignIds] = useState<string[]>(initial?.signIds ?? []);
  const [correctSignId, setCorrectSignId] = useState<string | null>(initial?.correctSignId ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signsById = new Map(signs.map((sign) => [sign.id, sign]));
  const chosen = signIds.flatMap((id) => signsById.get(id) ?? []);
  const repeated = repeatedLabels(chosen);
  const request = SaveExerciseRequest.safeParse({ type, signIds, correctSignId });
  const canSave = request.success && repeated.length === 0 && !saving;
  const full = signIds.length >= EXERCISE_MAX_OPTIONS;

  function add(id: string) {
    setSignIds((ids) => [...ids, id]);
    // The first sign chosen is the answer until the operator picks another.
    setCorrectSignId((current) => current ?? id);
  }

  function remove(id: string) {
    setSignIds((ids) => ids.filter((candidate) => candidate !== id));
    if (correctSignId === id) setCorrectSignId(null);
  }

  function move(index: number, step: -1 | 1) {
    setSignIds((ids) => {
      const next = [...ids];
      const [id] = next.splice(index, 1);
      if (id !== undefined) next.splice(index + step, 0, id);
      return next;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!request.success || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(request.data);
    } catch (failure) {
      setError(errorMessage(failure));
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit} aria-label="Exercício">
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Card className="grid gap-5">
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-semibold">Tipo</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {AdminExerciseType.options.map((option) => (
              <label
                key={option}
                className={`grid cursor-pointer gap-1 rounded-md p-3 shadow-[inset_0_0_0_1px_var(--color-border)] has-checked:bg-accent-soft has-checked:shadow-[inset_0_0_0_2px_var(--color-accent)] has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent`}
              >
                <span className="flex items-center gap-2 font-bold">
                  <input
                    type="radio"
                    name="exercise-type"
                    value={option}
                    checked={type === option}
                    onChange={() => setType(option)}
                  />
                  {exerciseTypes[option].name}
                </span>
                <span className={hintClassName}>{exerciseTypes[option].explanation}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="mb-2 font-semibold">
            Opções{' '}
            <span className="font-normal text-text-muted">
              ({EXERCISE_MIN_OPTIONS} a {EXERCISE_MAX_OPTIONS} sinais)
            </span>
          </legend>
          <p className={hintClassName}>
            Marque a resposta certa. As opções aparecem para o aluno nesta ordem; evite deixar a
            certa sempre no mesmo lugar.
          </p>

          {chosen.length > 0 && (
            <ol className="grid gap-2">
              {chosen.map((sign, index) => (
                <li
                  key={sign.id}
                  className="flex flex-wrap items-center gap-3 rounded-sm bg-surface-subtle px-3 py-2"
                >
                  {sign.imageUrls[0] && (
                    <SignThumb url={sign.imageUrls[0]} alt={sign.alt} size="sm" />
                  )}
                  <span className="min-w-24 font-bold">{sign.label}</span>
                  <label className="flex items-center gap-1.5 text-[13px] font-semibold">
                    <input
                      type="radio"
                      name="correct-sign"
                      checked={correctSignId === sign.id}
                      onChange={() => setCorrectSignId(sign.id)}
                    />
                    Resposta certa
                  </label>
                  <div className="ml-auto flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Subir “${sign.label}”`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Descer “${sign.label}”`}
                      disabled={index === chosen.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remover “${sign.label}”`}
                      onClick={() => remove(sign.id)}
                    >
                      ✕
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {repeated.length > 0 && (
            <p role="alert" className="text-[13px] font-semibold text-danger-dark">
              Mais de uma opção se chama “{repeated.join('”, “')}”. O aluno não conseguiria
              distinguir: troque um dos sinais.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {chosen.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSignIds((ids) => shuffled(ids))}
              >
                Embaralhar ordem
              </Button>
            )}
          </div>

          {full ? (
            <p className={hintClassName}>Limite de {EXERCISE_MAX_OPTIONS} opções atingido.</p>
          ) : (
            <SignSearch
              signs={signs}
              label="Adicionar sinal"
              excludeIds={signIds}
              onPick={(sign) => add(sign.id)}
            />
          )}
        </fieldset>
      </Card>

      <div className="flex gap-2">
        <Button variant="primary" type="submit" disabled={!canSave}>
          {saving ? 'Salvando…' : 'Salvar exercício'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
