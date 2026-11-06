# CMS (apps/admin)

App web (React + Vite) onde os operadores montam o conteúdo: trilhas, módulos, lições, exercícios, sinais e estudos. Só operadores entram; os alunos usam o app mobile.

## Estrutura

```
src/
  App.tsx              # Rotas (react-router), tudo atrás do AdminGate
  features/
    auth/              # Login, sessão do Supabase e AdminGate (verifica se a conta é operador)
    layout/            # Menu lateral e área de conteúdo
    home/
  shared/
    api/client.ts      # Cliente HTTP do BFF, valida as respostas com contracts
    api/supabase.ts    # Supabase só para login
    ui/styles.css      # Tokens copiados do app (manter em sincronia) e estilos base
  test/setup.ts
```

## Regras

* Dados de conteúdo vêm **sempre** do BFF, pelas rotas `/v1/admin/*`. O Supabase é usado só para login, com a chave publicável. A chave secreta nunca entra no CMS.
* Toda chamada passa por `shared/api/client.ts`, que envia o token e valida a resposta com `contracts`. Falhas viram `ApiError` (`network`, `server` ou `request` com o `code` do BFF). Um 401 encerra a sessão.
* O `AdminGate` decide o que aparece: sem sessão, a tela de login; com sessão, pergunta ao BFF (`GET /v1/admin/me`). Uma conta que não é operador ativo recebe `403 NOT_ADMIN` e vê "Sem acesso ao CMS".
* Contas de operador são separadas das contas do app: são criadas só pelo BFF, com `app\_metadata.role = 'admin'`, e o BFF exige esse papel **e** uma linha ativa em `app.admins`. Uma conta de aluno nunca vira operadora, e uma conta de operador não entra no app.
* O primeiro operador é criado com `pnpm --filter bff admin:create --email <email> --name <nome>`, que sempre cria uma conta nova (recusa e-mail que já tem conta) e mostra uma senha temporária uma única vez. Os demais operadores virão da tela de operadores (fase 6).
* Textos da interface em português; código em inglês.
* Sem bibliotecas de UI: CSS próprio com os tokens de `shared/ui/styles.css`.

## Decisões do produto

* Rascunho + publicar: o operador edita uma cópia de trabalho; "Publicar alterações" mostra o que mudou e publica tudo de uma vez, numa transação.
* Excluir conteúdo que alunos já fizeram é arquivar: some do app, mas progresso, XP e conquistas ficam.
* Pré-visualização simulada no navegador, com os tokens do app (aproximação, não o app real).

## Desenvolvimento

* `pnpm --filter bff dev` e `pnpm --filter admin dev` (http://localhost:5173). O Vite encaminha `/v1` para o BFF em `localhost:3000`, então o BFF não precisa de CORS em desenvolvimento. A hospedagem de produção ainda não foi decidida.
* `.env` a partir de `.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL`).
* Testes com Vitest + Testing Library (jsdom).
