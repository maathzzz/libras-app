'use client';

import { CreateOperatorRequest, type AdminOperator } from '@libras/contracts';
import { useCallback, useState, type FormEvent } from 'react';

import { useAdmin } from '@/features/auth/AdminGate';
import { TitleForm } from '@/features/curriculum/TitleForm';
import { errorMessage } from '@/shared/api/errorMessage';
import { useApiData } from '@/shared/api/useApiData';
import {
  Button,
  Card,
  ErrorBanner,
  hintClassName,
  inputClassName,
  labelClassName,
  LoadingText,
} from '@/shared/ui';

import {
  createOperator,
  getOperators,
  resetOperatorPassword,
  updateOperator,
} from './operatorsApi';

// A password the BFF answered once. It lives only in this screen's state: leaving the screen
// loses it, as intended.
interface ShownPassword {
  email: string;
  password: string;
}

function PasswordNotice({ shown, onDone }: { shown: ShownPassword; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shown.password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div role="status" className="grid gap-3 rounded-md bg-success-soft p-4 text-success-dark">
      <p className="font-bold">Senha temporária de {shown.email}</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-sm bg-surface px-3 py-2 font-mono text-lg text-text">
          {shown.password}
        </code>
        <Button variant="secondary" size="sm" onClick={() => void copy()}>
          {copied ? 'Copiada' : 'Copiar'}
        </Button>
      </div>
      <p className="text-[13px]">
        Ela aparece só agora. Envie ao operador por um canal seguro; ao entrar, ele troca a senha em
        “Minha senha”.
      </p>
      <Button variant="secondary" size="sm" className="justify-self-start" onClick={onDone}>
        Já anotei
      </Button>
    </div>
  );
}

function NewOperatorForm({
  onCreate,
}: {
  onCreate: (email: string, name: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const request = CreateOperatorRequest.safeParse({ email, name });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!request.success) return;
    setSaving(true);
    try {
      await onCreate(request.data.email, request.data.name);
      setEmail('');
      setName('');
    } catch {
      // The page shows the error; the fields stay to be fixed.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="grid max-w-2xl gap-4">
      <h2 className="text-lg font-bold">Novo operador</h2>
      <form className="grid gap-4" onSubmit={submit} aria-label="Novo operador">
        <label className={labelClassName}>
          E-mail
          <input
            type="email"
            className={inputClassName}
            value={email}
            autoComplete="off"
            onChange={(event) => setEmail(event.target.value)}
          />
          <span className={hintClassName}>
            A conta de operador é separada da conta do app: use um e-mail que ainda não tenha conta.
            Um apelido como nome+cms@gmail.com serve.
          </span>
        </label>
        <label className={labelClassName}>
          Nome
          <input
            className={inputClassName}
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <Button
          variant="primary"
          type="submit"
          className="justify-self-start"
          disabled={!request.success || saving}
        >
          {saving ? 'Criando…' : 'Criar operador'}
        </Button>
      </form>
    </Card>
  );
}

function OperatorRow({
  operator,
  isSelf,
  run,
  onPassword,
}: {
  operator: AdminOperator;
  isSelf: boolean;
  run: (change: () => Promise<unknown>) => Promise<void>;
  onPassword: (shown: ShownPassword) => void;
}) {
  const [renaming, setRenaming] = useState(false);

  function toggleActive() {
    const question = operator.active
      ? `Desativar ${operator.name}?\n\nEle perde o acesso ao CMS na hora. Você pode reativá-lo depois.`
      : `Reativar ${operator.name}? Ele volta a entrar no CMS com a senha que já tinha.`;
    if (!window.confirm(question)) return;
    void run(() =>
      updateOperator(operator.userId, { name: operator.name, active: !operator.active }),
    );
  }

  function newPassword() {
    const question = `Gerar uma nova senha temporária para ${operator.name}?\n\nA senha atual deixa de funcionar.`;
    if (!window.confirm(question)) return;
    void run(async () => {
      const password = await resetOperatorPassword(operator.userId);
      onPassword({ email: operator.email, password });
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-surface-subtle px-4 py-3">
      {renaming ? (
        <TitleForm
          label={`Novo nome para ${operator.name}`}
          initialTitle={operator.name}
          submitLabel="Salvar"
          maxLength={60}
          onSubmit={async (name) => {
            await run(() => updateOperator(operator.userId, { name, active: operator.active }));
            setRenaming(false);
          }}
          onCancel={() => setRenaming(false)}
        />
      ) : (
        <div className="grid min-w-0 gap-0.5">
          <span className="flex flex-wrap items-center gap-2 font-bold">
            {operator.name}
            {isSelf && <span className="text-[13px] font-normal text-text-muted">(você)</span>}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                operator.active ? 'bg-success-soft text-success-dark' : 'bg-surface text-text-muted'
              }`}
            >
              {operator.active ? 'ativo' : 'desativado'}
            </span>
          </span>
          <span className="truncate text-[13px] text-text-muted">{operator.email}</span>
        </div>
      )}
      {!renaming && (
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setRenaming(true)}>
            Renomear
          </Button>
          <Button variant="ghost" size="sm" onClick={newPassword}>
            Nova senha
          </Button>
          {!isSelf && (
            <Button
              variant={operator.active ? 'danger' : 'secondary'}
              size="sm"
              onClick={toggleActive}
            >
              {operator.active ? 'Desativar' : 'Reativar'}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function OperatorsPage() {
  const admin = useAdmin();
  const { state, reload } = useApiData(getOperators);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<ShownPassword | null>(null);

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

  async function create(email: string, name: string) {
    setError(null);
    try {
      const password = await createOperator({ email, name });
      setShown({ email, password });
    } catch (failure) {
      setError(errorMessage(failure));
      throw failure;
    } finally {
      reload();
    }
  }

  return (
    <>
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold">Operadores</h1>
        <p className="text-text-muted">
          Quem pode entrar no CMS. Todo operador pode fazer tudo, inclusive gerenciar os outros.
          Operadores são desativados, nunca excluídos, e ninguém desativa a si mesmo.
        </p>
      </div>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {shown && <PasswordNotice shown={shown} onDone={() => setShown(null)} />}

      {state.status === 'loading' && <LoadingText />}
      {state.status === 'error' && (
        <ErrorBanner
          action={
            <Button variant="secondary" size="sm" onClick={reload}>
              Tentar de novo
            </Button>
          }
        >
          {errorMessage(state.error)}
        </ErrorBanner>
      )}
      {state.status === 'ready' && (
        <ul className="grid max-w-3xl gap-2" aria-label="Operadores">
          {state.data.map((operator) => (
            <OperatorRow
              key={operator.userId}
              operator={operator}
              isSelf={operator.email === admin.email}
              run={run}
              onPassword={setShown}
            />
          ))}
        </ul>
      )}

      <NewOperatorForm onCreate={create} />
    </>
  );
}
