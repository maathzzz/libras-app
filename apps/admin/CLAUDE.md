# CMS (apps/admin)

App web em **Next.js (App Router) + TypeScript + Tailwind CSS** onde os operadores montam o conteúdo: trilhas, módulos, lições, exercícios, sinais e estudos. Só operadores entram; os alunos usam o app mobile.

## Estrutura

```
src/
  app/                 # Rotas do App Router; layout.tsx envolve tudo no AdminGate + AppLayout
    globals.css        # Tailwind e tokens do app no @theme (manter em sincronia)
  features/
    auth/              # Login, sessão do Supabase e AdminGate (verifica se a conta é operador)
    layout/            # Menu lateral e área de conteúdo
    home/
    curriculum/        # Trilhas, módulos e lições do rascunho (/trilhas)
    signs/             # Sinais com upload de imagens (/sinais, /sinais/novo, /sinais/[signId])
  shared/
    api/client.ts      # Cliente HTTP do BFF, valida as respostas com contracts
    api/supabase.ts    # Supabase só para login
    api/useApiData.ts  # Carrega dados ao abrir a tela; reload() mantém os dados atuais enquanto busca
    api/errorMessage.ts # Mensagem em português para cada falha
    ui/                # Componentes base (Button, Card, campos, avisos) em Tailwind
  test/setup.ts
```

## Regras

- Dados de conteúdo vêm **sempre** do BFF, pelas rotas `/v1/admin/*`. O Supabase é usado só para login, com a chave publicável. A chave secreta nunca entra no CMS.
- Toda chamada passa por `shared/api/client.ts`, que envia o token e valida a resposta com `contracts`. Falhas viram `ApiError` (`network`, `server` ou `request` com o `code` do BFF). Um 401 encerra a sessão.
- O `AdminGate` decide o que aparece: sem sessão, a tela de login; com sessão, pergunta ao BFF (`GET /v1/admin/me`). Uma conta que não é operador ativo recebe `403 NOT_ADMIN` e vê "Sem acesso ao CMS".
- Contas de operador são separadas das contas do app: são criadas só pelo BFF, com `app\_metadata.role = 'admin'`, e o BFF exige esse papel **e** uma linha ativa em `app.admins`. Uma conta de aluno nunca vira operadora, e uma conta de operador não entra no app.
- O primeiro operador é criado com `pnpm --filter bff admin:create --email <email> --name <nome>`, que sempre cria uma conta nova (recusa e-mail que já tem conta) e mostra uma senha temporária uma única vez. Os demais operadores virão da tela de operadores (fase 6).
- Textos da interface em português; código em inglês.
- Estilo só com classes do Tailwind, usando os tokens de `app/globals.css` (`bg-surface`, `text-text-muted`, `rounded-md`...). Nada de cores soltas, CSS por componente ou bibliotecas de UI; o que se repete vira componente em `shared/ui`.
- O CMS roda no navegador: a sessão do Supabase vive no `localStorage`, então páginas e componentes que usam sessão, BFF ou estado são `'use client'`. Não usar Server Actions, route handlers nem buscar conteúdo no servidor do Next: o conteúdo vem do BFF. No render do servidor o `AdminGate` só mostra "Carregando…".
- Variáveis lidas no navegador são `NEXT_PUBLIC_*` e precisam ser lidas literalmente (`process.env.NEXT_PUBLIC_X`) para o Next embutir o valor.

- Depois de qualquer alteração a tela recarrega os dados do BFF (também quando falha: o erro costuma significar que a tela estava desatualizada). Sem cache nem atualização otimista.
- Reordenar envia a lista inteira na nova ordem; `INVALID_ORDER` (outra pessoa mudou a lista) vira aviso e recarga.
- Imagens de sinais vão direto do navegador para o Storage (`uploadSignImage`): o BFF só cria a URL assinada. Tipos e tamanho são checados antes do envio (`imageProblem`), mas quem garante é o bucket.
- Exclusões pedem confirmação dizendo o que sai junto e lembrando que os alunos só deixam de ver depois de publicar.

## Decisões do produto

- Rascunho + publicar: o operador edita uma cópia de trabalho; "Publicar alterações" mostra o que mudou e publica tudo de uma vez, numa transação.
- Excluir conteúdo que alunos já fizeram é arquivar: some do app, mas progresso, XP e conquistas ficam.
- Pré-visualização simulada no navegador, com os tokens do app (aproximação, não o app real).

## Desenvolvimento

- `pnpm --filter bff dev` e `pnpm --filter admin dev` (http://localhost:5173). O Next encaminha `/v1` (rewrite em `next.config.ts`) para o BFF em `BFF_URL` (padrão `http://localhost:3000`), então o navegador só fala com a própria origem e o BFF não precisa de CORS. Por isso a hospedagem precisa rodar o servidor do Next (`next start`), não um export estático; o provedor ainda não foi decidido.
- `.env` a partir de `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `BFF_URL`).
- Testes com Vitest + Testing Library (jsdom), em `vitest.config.ts`. Componentes que usam `next/navigation` mockam o módulo no teste.
- `pnpm --filter admin build` gera o build de produção.
