@apps/mobile/AGENTS.md
CLAUDE.md
===

Aplicativo gamificado para ensino de Libras (inspirado no Duolingo). Monorepo com app mobile em React Native, BFF em Node.js e banco no Supabase. Este documento define a arquitetura e as convenções que devem ser seguidas em todo código gerado.

## Escopo do MVP

* Retenção exclusivamente por **streak**: o usuário mantém a sequência completando ao menos uma lição por dia.
* XP é apenas uma pontuação acumulada.
* Conteúdo visual composto **somente por imagens** (sem vídeos, sem áudio).

**Fora do escopo — não implementar sem solicitação explícita:**

* Ligas, rankings, corações, conquistas e revisão espaçada
* TanStack Query ou qualquer outra biblioteca de cache de servidor
* Ferramentas de observabilidade (OpenTelemetry, Sentry, APM)
* Filas, jobs agendados, Redis ou EventBus
* Bibliotecas de injeção de dependência

O BFF deve ser escalável (stateless), mas sem over engineering. Na dúvida entre uma abstração e código direto, prefira o código direto.

## Estrutura do repositório

```
apps/
  mobile/        # React Native (Expo)
  bff/           # Node.js + Fastify
packages/
  contracts/     # Schemas Zod e tipos compartilhados da API
  tsconfig/
  eslint-config/
supabase/        # Migrations e seed (Supabase CLI)
```

Gerenciador de pacotes: **pnpm workspaces**. Nunca use npm ou yarn.

## Comandos

```bash
pnpm install
pnpm --filter bff dev          # BFF com recarga automática (tsx watch)
pnpm --filter mobile start     # Expo dev server
pnpm --filter <pacote> test
pnpm lint
pnpm typecheck

supabase start                 # Supabase local (requer Docker)
supabase db reset              # Recria o banco local com migrations + seed
supabase migration new <nome>  # Nova migration
```

Antes de considerar uma tarefa concluída, execute `pnpm typecheck`, `pnpm lint` e os testes do pacote alterado.

## packages/contracts

Fonte única de verdade dos dados trocados entre app e BFF.

* Contém apenas schemas Zod e tipos derivados (`z.infer`). Sem lógica de negócio, sem dependência de React, Fastify ou Supabase.
* Toda rota do BFF tem schemas de request e response definidos aqui.
* Exercícios são uma `z.discriminatedUnion('type', \[...])`. Tipos atuais: `sign\_to\_word`, `word\_to\_sign`, `fingerspelling`, `match\_pairs`, `handshape`.
* Imagens são representadas por `SignImage` (`url` + `alt`). Um sinal com movimento usa uma lista de imagens em sequência.
* Ao alterar um contrato, atualize o BFF e o app na mesma tarefa.

## BFF (apps/bff)

### Stack

Node.js LTS, TypeScript estrito, Fastify, `fastify-type-provider-zod`, Drizzle ORM (Postgres do Supabase), `jose` (validação do JWT do Supabase via JWKS), Vitest.

### Estrutura

```
src/
  modules/
    profile/          # Perfil e fuso horário
    curriculum/       # Unidades, lições, exercícios, sinais
    progress/         # Sessões de lição, XP, streak
      domain/         # Entidades, value objects, interfaces de repositório
      application/    # Casos de uso
      infrastructure/ # Implementações Drizzle dos repositórios
      http/           # Rotas e controllers
  shared/
    domain/           # Result, DomainError, LocalDate
    application/      # Clock
    infrastructure/   # db, plugin de auth, error handler, env
  container.ts        # Composition root manual
  main.ts
```

### Regras de arquitetura

* **Regra de dependência:** `http` e `infrastructure` → `application` → `domain`. O domínio nunca importa Fastify, Drizzle, Supabase ou qualquer biblioteca de infraestrutura.
* Um módulo **não importa** `infrastructure` nem `http` de outro módulo. Se um caso de uso precisar de dados de outro módulo, receba uma interface (port) pelo construtor.
* Repositórios são interfaces em `domain/` e implementações em `infrastructure/`.
* Dependências são injetadas pelo construtor e montadas manualmente em `container.ts`.
* Controllers são finos: validam a entrada (via schema), chamam o caso de uso e mapeiam o `Result` para HTTP. Nenhuma regra de negócio no controller.
* Operações que alteram várias tabelas usam uma transação dentro do método do repositório (ex.: `saveCompletion`). Não crie abstração de UnitOfWork.

### Casos de uso

* Uma classe por caso de uso, com um único método público `execute(input)`.
* Nomes no formato verbo + substantivo: `CompleteLesson`, `GetHome`, `UpdateProfile`.
* Erros esperados retornam `Result<T, DomainError>`. Exceções ficam reservadas para falhas inesperadas.
* O tempo atual vem sempre de `Clock` injetado. Nunca use `new Date()` ou `Date.now()` em domínio ou aplicação.

### Regras de domínio

**Streak** (`modules/progress/domain/Streak.ts`):

* O "dia" é a data local no fuso horário salvo no perfil do usuário (`LocalDate`).
* Ao concluir uma lição:

  * última atividade hoje → sem alteração;
  * última atividade ontem → `current + 1`;
  * caso contrário → reinicia em 1.
* `longest` é sempre o maior valor já atingido.
* Status na leitura: `done\_today`, `at\_risk` (última atividade ontem) ou `broken`. Quando `broken`, o valor exibido é 0.
* O streak é calculado na leitura (lazy). Não crie cron para quebrar streaks.

**Conclusão de lição** (`CompleteLesson`):

1. Se a `Idempotency-Key` já foi processada para o usuário, retornar o resultado anterior.
2. Recorrigir as respostas no servidor. O servidor é a fonte da verdade.
3. Calcular o XP.
4. Aplicar a regra do streak.
5. Persistir sessão, progresso e `user\_stats` em uma única transação.
6. Retornar XP ganho, streak atual e se o streak aumentou.

### HTTP

* Rotas versionadas em `/v1`.
* Endpoints são moldados pelas telas do app (ex.: `GET /v1/home` agrega trilha, streak e XP).
* Toda rota autenticada valida o JWT do Supabase no plugin de auth. O `userId` vem do token, nunca do corpo da requisição.
* Escritas sensíveis exigem o header `Idempotency-Key`.
* Formato de erro padronizado: `{ "error": { "code": string, "message": string } }`.

### Banco de dados

* Toda alteração de schema é feita por migration em `supabase/migrations`. Nunca altere o banco manualmente.
* Tabelas ficam no schema `app`, que não é exposto pela Data API do Supabase. O app nunca acessa o banco diretamente.
* O `payload jsonb` de `exercises` é validado com o schema de `contracts` antes da gravação.
* Conexão via pooler do Supabase em modo transação, com prepared statements desativados.

### Configuração

* Variáveis de ambiente validadas com Zod em `shared/infrastructure/env.ts` na inicialização. A aplicação não sobe com env inválido.
* O servidor escuta em `0.0.0.0` e na porta de `process.env.PORT` (exigência do Cloud Run).
* Nenhum estado em memória que precise sobreviver entre requisições, exceto cache de currículo invalidado por `content\_version`.

### Testes

* Casos de uso: testes unitários com repositórios em memória e `Clock` fixo.
* A regra do streak deve ter testes para: primeira lição, mesmo dia, dia seguinte, dia pulado, troca de fuso e virada de mês.
* Repositórios Drizzle: testes de integração contra o Supabase local.

## App (apps/mobile)

### Stack

Expo (development build), Expo Router, TypeScript estrito, Zustand, `react-native-mmkv`, `@supabase/supabase-js` (somente autenticação), `expo-secure-store`, `expo-image`, `react-native-reanimated`, `react-native-gesture-handler`, `expo-haptics`, `expo-notifications`, Jest + React Native Testing Library.

### Estrutura

```
app/                     # Rotas do Expo Router — apenas composição de telas
  (auth)/
  (tabs)/
  lesson/\[lessonId].tsx
src/
  features/
    auth/
    home/
    lesson/
      api/               # Funções que chamam o BFF
      store/             # Store Zustand da feature
      exercises/         # Um componente por tipo de exercício + registry
      components/
      index.ts           # API pública da feature
    streak/
    profile/
  shared/
    api/client.ts        # Cliente HTTP tipado com contracts
    ui/                  # Design system
    theme/               # Tokens do Claude Design
    lib/                 # storage, haptics, fila offline
```

### Regras de arquitetura

* Arquivos em `app/` só compõem telas a partir das features. Nenhuma lógica, chamada de API ou estado neles.
* Uma feature importa apenas de `shared` e do `index.ts` de outras features. Nunca importe arquivos internos de outra feature.
* Componentes não chamam a API diretamente: chamam ações do store (`load`, `refresh`, `submit`), que usam as funções de `api/`.
* Toda chamada ao BFF passa por `shared/api/client.ts`, que injeta o token e tipa a resposta com `contracts`.
* O app usa o Supabase **apenas** para autenticação. Dados de negócio vêm sempre do BFF.
* O token de sessão é armazenado com `expo-secure-store`. MMKV é usado para dados não sensíveis.

### Exercícios

* Cada tipo de exercício é um componente em `features/lesson/exercises/`, registrado no registry `Record<ExerciseType, ComponentType<ExerciseProps>>`.
* Para adicionar um tipo: criar o schema em `contracts`, criar o componente e registrá-lo. O player da lição não deve ser alterado.
* A correção local serve apenas para feedback imediato. O resultado oficial vem do BFF.

### Fluxo da lição

1. Buscar o bundle da lição.
2. Fazer `Image.prefetch()` de todas as imagens antes de iniciar.
3. Corrigir respostas localmente para feedback instantâneo.
4. Enviar a sessão com uma `Idempotency-Key` gerada no início da lição.
5. Em caso de falha de rede, enfileirar o envio no MMKV e reenviar quando houver conexão.

### Imagens

* Sempre use `expo-image` com `cachePolicy="memory-disk"`. Nunca use o `Image` do React Native.
* Toda imagem de sinal tem `accessibilityLabel` a partir do campo `alt`.
* Imagens do alfabeto manual e dos números são embarcadas no app. As demais vêm do Supabase Storage.

### Acessibilidade

O público inclui pessoas surdas:

* Nenhuma interação depende de áudio. Todo feedback é visual e háptico (`expo-haptics`).
* Textos em português simples e direto.
* Áreas de toque com no mínimo 44×44 pt.

### Estilo

* `StyleSheet` com tokens de `shared/theme`. Nunca use cores, espaçamentos ou tamanhos de fonte literais nos componentes.
* Não adicione bibliotecas de UI externas.
* Componentes reutilizáveis ficam em `shared/ui` e seguem as telas do Claude Design.

### Configuração

* URL do BFF em `EXPO\_PUBLIC\_API\_URL`.
* Desenvolvimento local: Android Emulator usa `http://10.0.2.2:<porta>`; dispositivo físico usa o IP da máquina na rede local.

## Convenções gerais

* Código, identificadores e nomes de arquivos em **inglês**; textos exibidos ao usuário em **português**.
* Arquivos de componente e classe em PascalCase (`Streak.ts`, `LessonPlayer.tsx`); demais arquivos em camelCase.
* Funções pequenas e com nomes que descrevem a intenção. Prefira early return a aninhamento.
* Nada de `any`. Use `unknown` e valide com Zod quando o tipo vier de fora.
* Comentários explicam o porquê, não o quê.
* Não adicione dependências novas sem necessidade clara; prefira os módulos Expo já listados.

