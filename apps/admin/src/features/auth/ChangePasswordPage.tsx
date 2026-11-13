'use client';

import { useState, type FormEvent } from 'react';

import {
  Button,
  Card,
  ErrorBanner,
  hintClassName,
  inputClassName,
  labelClassName,
} from '@/shared/ui';

import { useAdmin } from './AdminGate';
import { changePassword, MIN_PASSWORD_LENGTH, type ChangePasswordOutcome } from './session';

const messages: Record<Exclude<ChangePasswordOutcome, 'ok'>, string> = {
  wrongCurrent: 'A senha atual não confere.',
  weak: 'Escolha outra senha: esta é fraca demais ou igual à atual.',
  error: 'Não foi possível trocar a senha. Tente de novo.',
};

// Where an operator replaces the temporary password they received.
export function ChangePasswordPage() {
  const admin = useAdmin();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeated, setRepeated] = useState('');
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<ChangePasswordOutcome | null>(null);

  const tooShort = next.length > 0 && next.length < MIN_PASSWORD_LENGTH;
  const mismatch = repeated.length > 0 && repeated !== next;
  const canSave =
    current.length > 0 && next.length >= MIN_PASSWORD_LENGTH && repeated === next && !saving;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setOutcome(null);
    const result = await changePassword(admin.email, current, next);
    setOutcome(result);
    setSaving(false);
    if (result === 'ok') {
      setCurrent('');
      setNext('');
      setRepeated('');
    }
  }

  return (
    <>
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold">Minha senha</h1>
        <p className="text-text-muted">
          Troque a senha temporária que você recebeu por uma que só você conhece.
        </p>
      </div>
      {outcome === 'ok' && (
        <p role="status" className="rounded-md bg-success-soft px-4 py-3 text-success-dark">
          Senha trocada. Use a nova senha na próxima vez que entrar.
        </p>
      )}
      {outcome && outcome !== 'ok' && <ErrorBanner>{messages[outcome]}</ErrorBanner>}

      <Card className="grid max-w-md gap-4">
        <form className="grid gap-4" onSubmit={submit} aria-label="Trocar senha">
          <label className={labelClassName}>
            Senha atual
            <input
              type="password"
              autoComplete="current-password"
              className={inputClassName}
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </label>
          <label className={labelClassName}>
            Nova senha
            <input
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
            <span className={tooShort ? 'text-[13px] text-danger-dark' : hintClassName}>
              Pelo menos {MIN_PASSWORD_LENGTH} caracteres.
            </span>
          </label>
          <label className={labelClassName}>
            Repita a nova senha
            <input
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              value={repeated}
              onChange={(event) => setRepeated(event.target.value)}
            />
            {mismatch && (
              <span className="text-[13px] text-danger-dark">As senhas não são iguais.</span>
            )}
          </label>
          <Button
            variant="primary"
            type="submit"
            className="justify-self-start"
            disabled={!canSave}
          >
            {saving ? 'Trocando…' : 'Trocar senha'}
          </Button>
        </form>
      </Card>
    </>
  );
}
