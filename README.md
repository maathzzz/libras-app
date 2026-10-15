# Libras App

Aplicativo gamificado para aprender **Libras** (Língua Brasileira de Sinais), inspirado no Duolingo. Lições curtas, feedback imediato e uma sequência diária (streak) que incentiva a prática todos os dias.

O público inclui pessoas surdas e ouvintes. Por isso, nenhuma interação depende de áudio: todo o feedback é visual e háptico, e os textos usam português simples e direto.

## Objetivo

Oferecer um caminho simples e constante para aprender Libras no celular:

- **Trilhas de lições** com exercícios variados: reconhecer um sinal, escolher o sinal de uma palavra, soletrar com o alfabeto manual, combinar pares e identificar configurações de mão.
- **Streak** como único mecanismo de retenção: completar ao menos uma lição por dia mantém a sequência.
- **XP** como pontuação acumulada.
- **Meta diária** (1, 3, 5 ou 8 lições) como alvo pessoal, exibido no progresso do dia. Ela não muda a regra do streak.
- **Estudos por trilha**: páginas de conteúdo, na aba "Estudar", que ensinam o assunto passo a passo antes das lições. São recomendados, mas não bloqueiam lições nem dão XP.
- **Alfabeto e números** sempre disponíveis para consulta.

O conteúdo visual é composto **apenas por imagens**. Um sinal com movimento é mostrado como uma sequência de imagens.

### Fora do escopo do MVP

Ligas, rankings, corações, conquistas, revisão espaçada, vídeos e áudio.

## Arquitetura

Monorepo com três partes que conversam por contratos compartilhados:

```
┌──────────────┐   HTTPS + JWT    ┌──────────────┐    SQL     ┌────────────────┐
│  App mobile  │ ───────────────▶ │     BFF      │ ─────────▶ │    Supabase    │
│ React Native │                  │   Fastify    │            │ Postgres + Auth│
└──────┬───────┘                  └──────────────┘            └────────────────┘
       │            login                                             ▲
       └──────────────────────────────────────────────────────────────┘
```

- **App mobile** (`apps/mobile`): Expo + Expo Router. Usa o Supabase **somente para autenticação**. Todos os dados de negócio vêm do BFF.
- **BFF** (`apps/bff`): Node.js + Fastify, stateless. Valida o JWT do Supabase, corrige as respostas no servidor (fonte da verdade) e calcula XP e streak. Endpoints são moldados pelas telas do app (ex.: `GET /v1/home`).
- **Supabase** (`supabase/`): Postgres e Auth. As tabelas ficam no schema `app`, que não é exposto pela Data API. O app nunca acessa o banco diretamente.
- **Contratos** (`packages/contracts`): schemas Zod e tipos compartilhados entre app e BFF. É a fonte única de verdade dos dados trocados pela API.

## Estrutura do repositório

```
apps/
  mobile/          # App React Native (Expo)
  bff/             # Backend for Frontend em Node.js + Fastify
packages/
  contracts/       # Schemas Zod e tipos da API
  tsconfig/        # Configurações TypeScript compartilhadas
  eslint-config/   # Configuração ESLint compartilhada
supabase/          # Migrations e seed (Supabase CLI)
docs/
  design/          # Inventário de telas e tokens do design
```

## Status atual

| Parte                | Situação                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `apps/mobile`        | Telas de início, lição, recompensa, estudo, alfabeto, ajustes, onboarding e login implementadas com dados mockados |
| `packages/contracts` | Schemas de home, lição, exercícios, estudo, perfil, streak e formato de erro                                       |
| `apps/bff`           | Esqueleto: Fastify, env, error handler, `GET /health`, `LocalDate`, `Clock` e `Result`. Sem módulos ainda          |
| `supabase/`          | Ainda não criado                                                                                                   |

Enquanto o BFF e o Supabase não existem, as funções em `features/*/api/` do app retornam mocks validados pelos mesmos schemas de `contracts`. Quando os endpoints estiverem prontos, apenas essas funções mudam.

## Primeiros passos

### Pré-requisitos

- Node.js LTS
- [pnpm](https://pnpm.io/) (versão definida em `package.json`). **Não use npm nem yarn.**
- Android Emulator, simulador iOS ou dispositivo físico com um development build do Expo
- Docker e [Supabase CLI](https://supabase.com/docs/guides/cli), quando o backend estiver disponível

### Instalação

```bash
pnpm install
```

### Rodar o app

```bash
pnpm --filter mobile start      # Expo dev server
pnpm --filter mobile android    # Development build no Android
pnpm --filter mobile ios        # Development build no iOS
```

O app usa bibliotecas com código nativo (como `react-native-mmkv`), então precisa de um **development build**, não do Expo Go.

A URL do BFF é lida de `EXPO_PUBLIC_API_URL`. Em desenvolvimento local:

- Android Emulator: `http://10.0.2.2:<porta>`
- Dispositivo físico: `http://<ip-da-máquina-na-rede>:<porta>`

### Rodar o backend (quando disponível)

```bash
supabase start                  # Supabase local (requer Docker)
supabase db reset               # Recria o banco com migrations + seed
pnpm --filter bff dev           # BFF com recarga automática
```

## Comandos úteis

```bash
pnpm lint                       # Lint de todos os pacotes
pnpm typecheck                  # Typecheck de todos os pacotes
pnpm test                       # Testes de todos os pacotes
pnpm --filter <pacote> test     # Testes de um pacote
pnpm format                     # Formata o código com Prettier
```

Antes de considerar uma tarefa concluída, rode `pnpm typecheck`, `pnpm lint` e os testes do pacote alterado.

## Convenções

- Código, identificadores e nomes de arquivos em **inglês**; textos exibidos ao usuário em **português**.
- TypeScript estrito, sem `any`. Dados externos são validados com Zod.
- Ao alterar um contrato em `packages/contracts`, atualize o BFF e o app na mesma tarefa.
- No app, cada feature importa apenas de `shared` e do `index.ts` de outras features. As fronteiras são verificadas pelo `eslint-plugin-boundaries`.
- Estilos usam os tokens de `shared/theme`, sem valores literais nos componentes.

As regras completas de arquitetura e convenções estão em [`CLAUDE.md`](./CLAUDE.md). O inventário de telas e os tokens de design ficam em [`docs/design`](./docs/design).
