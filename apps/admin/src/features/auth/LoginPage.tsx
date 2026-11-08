'use client';

import { useState, type FormEvent } from 'react';

import { Button, cardClassName } from '@/shared/ui';

import { signIn } from './session';

const messages = {
  invalid: 'E-mail ou senha incorretos.',
  error: 'Não foi possível entrar agora. Tente de novo em instantes.',
} as const;

const inputClassName =
  'min-h-10 rounded-sm border border-border bg-surface px-3 font-normal focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<keyof typeof messages | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email.trim(), password);
    // On success the session changes and the gate replaces this page.
    if (result !== 'ok') {
      setError(result);
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <form
        className={`${cardClassName} grid w-full max-w-100 gap-4`}
        onSubmit={submit}
        aria-labelledby="login-title"
      >
        <div>
          <h1 id="login-title" className="text-2xl font-bold">
            Libras CMS
          </h1>
          <p className="text-text-muted">Entre com sua conta de operador.</p>
        </div>
        <label className="grid gap-1.5 font-semibold">
          E-mail
          <input
            className={inputClassName}
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="grid gap-1.5 font-semibold">
          Senha
          <input
            className={inputClassName}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="text-danger-dark" role="alert">
            {messages[error]}
          </p>
        )}
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
