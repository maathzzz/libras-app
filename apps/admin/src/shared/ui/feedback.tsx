import type { ReactNode } from 'react';

export function LoadingText() {
  return <p className="text-text-muted">Carregando…</p>;
}

export function ErrorBanner({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-danger-soft px-4 py-3 text-danger-dark"
    >
      <p>{children}</p>
      {action}
    </div>
  );
}

// Shown on every editing screen: there is no draft, so changes reach the app at once.
export function ContentNotice() {
  return (
    <p className="rounded-md bg-accent-soft px-4 py-3 text-accent-dark">
      As alterações chegam aos alunos na hora em tudo que está visível. Trilhas, módulos, lições e
      estudos novos nascem ocultos: mostre quando estiverem prontos.
    </p>
  );
}
