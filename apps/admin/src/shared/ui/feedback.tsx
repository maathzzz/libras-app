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

// Shown on every editing screen until the publish screen exists.
export function DraftNotice() {
  return (
    <p className="rounded-md bg-accent-soft px-4 py-3 text-accent-dark">
      Tudo aqui é rascunho: os alunos só veem as alterações depois de “Publicar alterações”.
    </p>
  );
}
