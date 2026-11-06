import { useState, type FormEvent } from 'react';

import { signIn } from './session';

const messages = {
  invalid: 'E-mail ou senha incorretos.',
  error: 'Não foi possível entrar agora. Tente de novo em instantes.',
} as const;

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
    <main className="centered-page">
      <form className="card" onSubmit={submit} aria-labelledby="login-title">
        <div>
          <h1 id="login-title">Libras CMS</h1>
          <p className="muted">Entre com sua conta de operador.</p>
        </div>
        <label className="field">
          E-mail
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          Senha
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="error-text" role="alert">
            {messages[error]}
          </p>
        )}
        <button className="button button--primary" type="submit" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
