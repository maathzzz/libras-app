'use client';

import type { AdminMeResponse } from '@libras/contracts';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { ApiError } from '@/shared/api/client';
import { Button, cardClassName } from '@/shared/ui';

import { getAdminMe } from './adminApi';
import { LoginPage } from './LoginPage';
import { signOut, useSession } from './session';

const AdminContext = createContext<AdminMeResponse | null>(null);

// The operator signed in to the CMS. Only used below AdminGate.
export function useAdmin(): AdminMeResponse {
  const admin = useContext(AdminContext);
  if (!admin) throw new Error('useAdmin must be used inside AdminGate');
  return admin;
}

type GateState =
  | { kind: 'loading' }
  | { kind: 'ready'; admin: AdminMeResponse }
  | { kind: 'notAdmin' }
  | { kind: 'error' };

function Loading() {
  return <p className="grid min-h-screen place-items-center p-4 text-text-muted">Carregando…</p>;
}

function Notice({ title, body, action }: { title: string; body: string; action: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className={`${cardClassName} grid w-full max-w-100 gap-4`} role="alert">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-text-muted">{body}</p>
        {action}
      </div>
    </main>
  );
}

const signOutButton = (
  <Button variant="secondary" onClick={() => void signOut()}>
    Sair
  </Button>
);

// Asks the BFF whether the signed-in account is an operator. Keyed by user, so switching
// accounts starts over instead of showing the previous operator for a moment.
function OperatorCheck({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    getAdminMe().then(
      (admin) => {
        if (current) setState({ kind: 'ready', admin });
      },
      (error: unknown) => {
        if (!current) return;
        const notAdmin = error instanceof ApiError && error.code === 'NOT_ADMIN';
        setState({ kind: notAdmin ? 'notAdmin' : 'error' });
      },
    );
    return () => {
      current = false;
    };
  }, [attempt]);

  switch (state.kind) {
    case 'loading':
      return <Loading />;
    case 'notAdmin':
      return (
        <Notice
          title="Sem acesso ao CMS"
          body="Esta conta não é de um operador. Entre com a conta de operador ou peça acesso a um administrador."
          action={signOutButton}
        />
      );
    case 'error':
      return (
        <Notice
          title="Não foi possível carregar o CMS"
          body="O servidor não respondeu. Verifique a conexão e tente de novo."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setState({ kind: 'loading' });
                setAttempt((value) => value + 1);
              }}
            >
              Tentar de novo
            </Button>
          }
        />
      );
    case 'ready':
      return <AdminContext.Provider value={state.admin}>{children}</AdminContext.Provider>;
  }
}

// Everything in the CMS sits behind this gate: signed out shows the login, and a signed-in
// account only gets through when the BFF confirms it is an active operator. The session only
// exists in the browser, so the server render always stops at "Carregando…".
export function AdminGate({ children }: { children: ReactNode }) {
  const session = useSession();

  if (session.status === 'loading') return <Loading />;
  if (session.status === 'signedOut') return <LoginPage />;
  return <OperatorCheck key={session.userId}>{children}</OperatorCheck>;
}
