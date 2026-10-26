@apps/mobile/AGENTS.md

CLAUDE.md
===

Aplicativo gamificado para ensino de Libras (inspirado no Duolingo). Monorepo com app mobile em React Native, BFF em Node.js e banco no Supabase. Este documento define a arquitetura e as convenções que devem ser seguidas em todo código gerado.

## Escopo do MVP

* Retenção por **streak**: o usuário mantém a sequência completando ao menos uma lição por dia.
* XP é apenas uma pontuação acumulada. A regra de cálculo está em "Regras de domínio".
* A **meta diária** (1, 3, 5 ou 8 lições) é só um alvo pessoal, exibido no progresso do dia. Ela não altera a regra do streak.
* Conteúdo visual composto **somente por imagens** (sem vídeos, sem áudio).
* **Estudos**: páginas de conteúdo que ensinam, passo a passo, o assunto de uma trilha antes das lições. Ficam na aba "Estudar", agrupados por trilha. São recomendados, mas **não bloqueiam lições, não dão XP e não contam para o streak**. Usam apenas texto e imagens. Na interface o nome é "Estudo"; no código, `study` (para não confundir com `lesson`, que é a sessão de exercícios). O estudo de exemplo é o "Alfabeto manual"; os das demais trilhas serão definidos junto com o planejamento de cada trilha.

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

# Supabase CLI (dependência de desenvolvimento da raiz: use via pnpm exec)
pnpm exec supabase migration new <nome>   # Nova migration
pnpm exec supabase db push --dry-run      # Mostra o que seria aplicado no projeto remoto
pnpm --filter bff db:seed:generate        # Regera supabase/seed.sql a partir de scripts/seed
```

O desenvolvimento usa um projeto Supabase **na nuvem** (não há Supabase local). Por isso:

* **Nunca** rode `supabase db reset` contra o projeto remoto (`--linked` ou `--db-url`): ele apaga todos os dados.
* **Nunca** rode `supabase db push` (com ou sem `--include-seed`) sem aprovação explícita do usuário. Antes, mostre o SQL completo das migrations pendentes e do seed e aguarde a aprovação.
* `supabase login` e `supabase link` são interativos: peça ao usuário para executá-los.

Antes de considerar uma tarefa concluída, execute `pnpm typecheck`, `pnpm lint` e os testes do pacote alterado.

## packages/contracts

Fonte única de verdade dos dados trocados entre app e BFF.

* Contém apenas schemas Zod e tipos derivados (`z.infer`). Sem lógica de negócio, sem dependência de React, Fastify ou Supabase.
* Toda rota do BFF tem schemas de request e response definidos aqui.
* Exercícios são uma `z.discriminatedUnion('type', \[...])`. Tipos atuais: `sign\_to\_word`, `word\_to\_sign`, `fingerspelling`, `match\_pairs`, `handshape`.
* Imagens são representadas por `SignImage` (`url` + `alt`). Um sinal com movimento usa uma lista de imagens em sequência.
* Estudos ficam em `study.ts`. Os blocos de uma página também são uma `z.discriminatedUnion('type', \[...])` (`StudyBlock`). Tipos atuais: `text`, `sign` (rótulo + `SignImageSequence` + dica opcional) e `tip`.
* Ao alterar um contrato, atualize o BFF e o app na mesma tarefa.

## BFF (apps/bff)

### Stack

Node.js LTS, TypeScript estrito, Fastify, `fastify-type-provider-zod`, Drizzle ORM (Postgres do Supabase), `jose` (validação do JWT do Supabase via JWKS), Vitest.

### Estrutura

```
src/
  modules/
    profile/          # Perfil
    curriculum/       # Unidades, lições, exercícios, sinais, estudos
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

* O "dia" é a data local do dispositivo (`LocalDate`), no formato `YYYY-MM-DD`. O app a envia no header `X-Local-Date` em todas as requisições e no corpo da conclusão (`localDate`). O BFF não conhece o fuso do usuário.
* O BFF rejeita uma `localDate` mais de 1 dia à frente da data UTC do `Clock` (UTC+14 é o fuso mais adiantado). Datas no passado são aceitas, porque a fila offline envia lições atrasadas.
* Ao concluir uma lição:

  * última atividade hoje → sem alteração;
  * última atividade ontem → `current + 1`;
  * data da conclusão anterior à última atividade → sem alteração (o streak nunca retrocede);
  * caso contrário → reinicia em 1.
* Última atividade depois de hoje (lição antiga vinda da fila offline ou data do aparelho que voltou) → tratada como hoje: status `done\_today`.
* `longest` é sempre o maior valor já atingido.
* Status na leitura: `done\_today`, `at\_risk` (última atividade ontem) ou `broken`. Quando `broken`, o valor exibido é 0.
* O streak é calculado na leitura (lazy). Não crie cron para quebrar streaks.

**XP** (`modules/progress/domain/XpPolicy.ts`):

* 10 XP por lição concluída, com qualquer número de acertos.
* +5 XP de bônus quando o servidor corrige todas as respostas da lição como certas.
* Refazer uma lição já concluída concede XP de novo. Isso incentiva a revisão e mantém a regra simples.
* O XP é calculado sobre a correção do servidor, nunca sobre a do app.
* Uma `Idempotency-Key` repetida não concede XP de novo: o resultado anterior é retornado (passo 1 de `CompleteLesson`).

**Conclusão de lição** (`CompleteLesson`):

1. Se a `Idempotency-Key` já foi processada para o usuário, retornar o resultado anterior.
2. Rejeitar com `LOCAL\_DATE\_TOO\_FAR\_AHEAD` uma `localDate` mais de 1 dia à frente da data UTC do `Clock`.
3. Recorrigir as respostas no servidor com `AnswerGrader` (`modules/progress/domain/AnswerGrader.ts`). O servidor é a fonte da verdade. Resposta ausente ou duplicada para um exercício conta como incorreta; resposta para exercício fora da lição é ignorada.
4. Calcular o XP.
5. Aplicar a regra do streak com a `localDate`.
6. Persistir sessão, progresso e `user\_stats` em uma única transação.
7. Retornar XP ganho, streak atual e se o streak aumentou.

**Estudos** (módulo `curriculum`):

* São conteúdo de leitura: `GetStudies` (lista por trilha) e `GetStudy` (páginas de um estudo). Não há escrita, correção, XP nem streak.
* Fazem parte do cache de currículo invalidado por `content\_version`.
* Não bloqueiam lições: a liberação das lições continua decidida só pelo progresso de exercícios.
* Marcar um estudo como visto fica para depois. Quando for feito, a escrita vai para o módulo `progress` e exige `Idempotency-Key`.

### HTTP

* Rotas versionadas em `/v1`.
* Endpoints são moldados pelas telas do app (ex.: `GET /v1/home` agrega trilha, streak e XP).
* Estudos: `GET /v1/studies` (aba "Estudar", `StudiesResponse`) e `GET /v1/studies/:studyId` (`StudyGuide`). Id desconhecido retorna 404.
* Perfil: `GET /v1/me` (cria o perfil no primeiro acesso, com o nome tirado do e-mail do token), `PATCH /v1/me` (`UpdateProfileRequest`) e `DELETE /v1/me` (exclui os dados no schema `app` e o usuário do Supabase Auth; idempotente, responde 204).
* Toda rota autenticada valida o JWT do Supabase no plugin de auth. O `userId` vem do token, nunca do corpo da requisição.
* O plugin de auth (`shared/infrastructure/auth.ts`) é registrado no escopo `/v1`. Ele verifica a assinatura pelo JWKS do projeto (só ES256/RS256: o segredo HS256 legado é recusado), a expiração, o `iss` (`<SUPABASE_URL>/auth/v1`) e o `aud` (`authenticated`). Token ausente ou inválido retorna 401 `UNAUTHORIZED`; falha ao buscar as chaves retorna 500.
* Escritas sensíveis exigem o header `Idempotency-Key`.
* O app envia a data local do dispositivo no header `X-Local-Date` (`YYYY-MM-DD`) em todas as requisições. As rotas que precisam dele o leem com `readLocalDate` (`shared/infrastructure/localDateHeader.ts`), que retorna 400 `INVALID_LOCAL_DATE` quando ausente ou inválido. A conclusão de lição usa a `localDate` do corpo, capturada quando a lição terminou.
* Formato de erro padronizado: `{ "error": { "code": string, "message": string } }`.

### Banco de dados

* Toda alteração de schema é feita por migration em `supabase/migrations`. Nunca altere o banco manualmente.
* Tabelas ficam no schema `app`, que não é exposto pela Data API do Supabase. O app nunca acessa o banco diretamente.
* O `payload jsonb` de `exercises` é validado com o schema de `contracts` antes da gravação.
* Estudos ficam em `app.studies` (`id`, `trail\_id`, `position`, `title`, `description`, `pages jsonb`). O `pages` é validado com `StudyPage` de `contracts` antes da gravação, como o `payload` de `exercises`.
* Conexão via pooler do Supabase em modo transação, com prepared statements desativados.
* O schema Drizzle (`shared/infrastructure/db/schema.ts`) espelha as migrations e serve só para tipar as consultas. As migrations são a fonte da verdade: altere os dois juntos.
* O seed (`supabase/seed.sql`) é gerado por `apps/bff/scripts/seed`, que valida os exercícios com `contracts`. Não edite o SQL à mão. O seed faz upsert por id, porque o banco remoto nunca é recriado.

### Configuração

* Variáveis de ambiente validadas com Zod em `shared/infrastructure/env.ts` na inicialização. A aplicação não sobe com env inválido.
* `SUPABASE_URL` dá origem ao JWKS, ao `iss` esperado e à API administrativa do Auth. `SUPABASE_SECRET_KEY` (`sb\_secret\_…`) é usada só na API administrativa (ex.: excluir conta).
* A chave secreta do Supabase existe **apenas no BFF** (env do Cloud Run e `.env` local, fora do git). Ela nunca vai para o app, para variáveis `EXPO\_PUBLIC\_\*` nem para o repositório.
* O servidor escuta em `0.0.0.0` e na porta de `process.env.PORT` (exigência do Cloud Run).
* Nenhum estado em memória que precise sobreviver entre requisições, exceto cache de currículo invalidado por `content\_version`.

### Testes

* Casos de uso: testes unitários com repositórios em memória e `Clock` fixo.
* A regra do streak deve ter testes para: primeira lição, mesmo dia, dia seguinte, dia pulado, data anterior à última atividade e virada de mês.
* `CompleteLesson` deve ter testes para: data à frente do limite (rejeitada), data no passado vinda da fila offline (aceita, sem alterar o streak se for anterior à última atividade) e virada de dia.
* A regra do XP deve ter testes para: lição com erros, lição sem erros e lição refeita.
* Repositórios Drizzle: testes de integração contra o Supabase local.

## App (apps/mobile)

### Stack

Expo (development build), Expo Router, TypeScript estrito, Zustand, `react-native-mmkv`, `@supabase/supabase-js` (somente autenticação), `expo-secure-store`, `expo-image`, `react-native-reanimated`, `react-native-gesture-handler`, `expo-haptics`, `expo-notifications`, Jest + React Native Testing Library.

### Estrutura

```
src/
  app/                   # Rotas do Expo Router — apenas composição de telas
    (auth)/
    (tabs)/
    lesson/\[lessonId].tsx
    study/\[studyId].tsx  # Leitor de um estudo (tela cheia)
  features/
    auth/
    home/
    lesson/
      api/               # Funções que chamam o BFF
      store/             # Store Zustand da feature
      exercises/         # Um componente por tipo de exercício + registry
      components/
      index.ts           # API pública da feature
    study/               # Aba "Estudar" e leitor de páginas de estudo
    onboarding/          # Boas-vindas, nível e meta diária
    settings/            # Ajustes
    streak/
    profile/
  shared/
    api/client.ts        # Cliente HTTP tipado com contracts
    ui/                  # Design system
    theme/               # Tokens do Claude Design
    lib/                 # storage, haptics, fila offline
```

### Regras de arquitetura

* Arquivos em `src/app/` só compõem telas a partir das features. Nenhuma lógica, chamada de API ou estado neles.
* Uma feature importa apenas de `shared` e do `index.ts` de outras features. Nunca importe arquivos internos de outra feature. Essas fronteiras são verificadas pelo `eslint-plugin-boundaries` (`apps/mobile/eslint.config.mjs`).
* Componentes não chamam a API diretamente: chamam ações do store (`load`, `refresh`, `submit`), que usam as funções de `api/`.
* Toda chamada ao BFF passa por `shared/api/client.ts`, que injeta o token e tipa a resposta com `contracts`.
* O app usa o Supabase **apenas** para autenticação. Dados de negócio vêm sempre do BFF.
* O cadastro não exige confirmação de e-mail: a opção **Confirm email** fica desativada no Supabase, e o `signUp` já devolve uma sessão que leva o usuário direto ao app. Se o `signUp` voltar sem sessão (a opção foi religada), o app mostra um erro e mantém o usuário no cadastro. Só a recuperação de senha envia e-mail (código de 6 dígitos).
* O app conhece só a chave publicável do Supabase. A chave secreta nunca entra no app: qualquer operação administrativa (como excluir a conta) passa pelo BFF.
* A sessão do Supabase (que pode passar do limite de tamanho por valor do `expo-secure-store`) fica em um MMKV criptografado (`shared/lib/secureStorage.ts`), cuja chave fica no `expo-secure-store`. O MMKV comum é usado só para dados não sensíveis.
* O cliente Supabase (`shared/api/supabase.ts`) usa `EXPO\_PUBLIC\_SUPABASE\_URL` e `EXPO\_PUBLIC\_SUPABASE\_PUBLISHABLE\_KEY`. `client.ts` envia o token no header `Authorization`; diante de um 401 renova a sessão uma vez e repete a requisição, e se a renovação for recusada encerra a sessão.

### Exercícios

* Cada tipo de exercício é um componente em `features/lesson/exercises/`, registrado no registry `Record<ExerciseType, ComponentType<ExerciseProps>>`.
* Para adicionar um tipo: criar o schema em `contracts`, criar o componente e registrá-lo. O player da lição não deve ser alterado.
* A correção local serve apenas para feedback imediato. O resultado oficial vem do BFF.

### Fluxo da lição

1. Buscar o bundle da lição.
2. Fazer `Image.prefetch()` de todas as imagens antes de iniciar.
3. Corrigir respostas localmente para feedback instantâneo.
4. Ao terminar a lição, capturar a `localDate` (data local do aparelho, de `shared/lib/localDate.ts`, montada com os componentes locais e nunca com `toISOString()`, que dá a data UTC).
5. Enviar a sessão com uma `Idempotency-Key` gerada no início da lição e a `localDate`.
6. Em caso de falha de rede, enfileirar o envio no MMKV (com a `localDate`) e reenviar quando houver conexão. No reenvio, usar a data salva, nunca a data atual.

### Estudos

* A feature `features/study/` tem a aba "Estudar" (`StudiesScreen`, lista por trilha) e o leitor (`StudyScreen`, rota `study/\[studyId]`, uma página por vez com "Continuar"/"Voltar" e os segmentos do `Header`).
* Ao abrir um estudo, buscar o `StudyGuide` e fazer `Image.prefetch()` das imagens antes de mostrar a primeira página.
* Cada tipo de bloco é um `case` em `features/study/components/StudyBlockView.tsx`. Para adicionar um tipo: criar o schema em `contracts` e o `case` correspondente; o `switch` não tem `default`, então o typecheck aponta o caso que falta.
* Nada é enviado ao BFF ao concluir: "Concluir" só fecha o leitor.
* Enquanto o BFF não existe, `api/studyMocks.ts` traz o estudo "Alfabeto manual", que reaproveita as letras exportadas por `features/alphabet`. O texto é provisório e precisa de revisão por especialista em Libras.

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

