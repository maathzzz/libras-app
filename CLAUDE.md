CLAUDE.md
===

Aplicativo gamificado para ensino de Libras (inspirado no Duolingo). Monorepo com app mobile em React Native, CMS web para os operadores de conteúdo, BFF em Node.js e banco no Supabase. Este documento define a arquitetura e as convenções que devem ser seguidas em todo código gerado. As regras específicas de cada app ficam em `apps/bff/CLAUDE.md`, `apps/mobile/CLAUDE.md` e `apps/admin/CLAUDE.md`, carregados quando o trabalho envolve arquivos dessas pastas.

## Escopo do MVP

- Retenção por **streak**: o usuário mantém a sequência completando ao menos uma lição por dia.
- XP é apenas uma pontuação acumulada. A regra de cálculo está em "Regras de domínio".
- A **meta diária** (1, 3, 5 ou 8 lições) é só um alvo pessoal, exibido no progresso do dia. Ela não altera a regra do streak.
- Conteúdo visual composto **somente por imagens** (sem vídeos, sem áudio).
- **Conquistas**: 15 conquistas fixas (lições, lições sem erro, revisão, XP, streak e módulos), desbloqueadas ao concluir uma lição e listadas no perfil com o progresso de cada uma. O catálogo e as regras ficam no BFF (`modules/progress/domain/Achievements.ts`).
- **Estudos**: páginas de conteúdo que ensinam um assunto passo a passo. Ficam na aba "Estudar", divididos em **grupos de estudo** (ex.: "Primeiros passos"), com nome livre e sem ligação com as trilhas; um estudo pertence a um grupo e pode ser movido para outro. São recomendados, mas **não bloqueiam lições, não dão XP e não contam para o streak**. Usam apenas texto e imagens. Na interface o nome é "Estudo"; no código, `study` (para não confundir com `lesson`, que é a sessão de exercícios). O estudo de exemplo é o "Alfabeto manual".

**Fora do escopo — não implementar sem solicitação explícita:**

- Ligas, rankings, corações e revisão espaçada
- TanStack Query ou qualquer outra biblioteca de cache de servidor
- Ferramentas de observabilidade (OpenTelemetry, Sentry, APM)
- Filas, jobs agendados, Redis ou EventBus
- Bibliotecas de injeção de dependência

O BFF deve ser escalável (stateless), mas sem over engineering. Na dúvida entre uma abstração e código direto, prefira o código direto.

## Gerenciador de pacotes

**pnpm workspaces**. Nunca use npm ou yarn.

## Comandos

```bash
pnpm install
pnpm --filter bff dev          # BFF com recarga automática (tsx watch)
pnpm --filter mobile start     # Expo dev server
pnpm --filter admin dev        # CMS web em Next (http://localhost:5173), encaminha /v1 para o BFF local
pnpm --filter <pacote> test
pnpm lint
pnpm typecheck

# Supabase CLI (dependência de desenvolvimento da raiz: use via pnpm exec)
pnpm exec supabase migration new <nome>   # Nova migration
pnpm exec supabase db push --dry-run      # Mostra o que seria aplicado no projeto remoto
pnpm --filter bff db:seed:generate        # Regera supabase/seed.sql a partir de scripts/seed
pnpm --silent --filter bff dev:token      # Imprime o access token do usuário de teste (só desenvolvimento)
pnpm --filter bff admin:create --email <email> --name <nome>  # Cria uma conta de operador do CMS (nova, separada das contas do app)
```

O desenvolvimento usa um projeto Supabase **na nuvem** (não há Supabase local). Por isso:

- **Nunca** rode `supabase db reset` contra o projeto remoto (`--linked` ou `--db-url`): ele apaga todos os dados.
- **Nunca** rode `supabase db push` (com ou sem `--include-seed`) sem aprovação explícita do usuário. Antes, mostre o SQL completo das migrations pendentes e do seed e aguarde a aprovação.
- `supabase login` e `supabase link` são interativos: peça ao usuário para executá-los.

Antes de considerar uma tarefa concluída, execute `pnpm typecheck`, `pnpm lint` e os testes do pacote alterado.

## packages/contracts

Fonte única de verdade dos dados trocados entre app e BFF.

- Contém apenas schemas Zod e tipos derivados (`z.infer`). Sem lógica de negócio, sem dependência de React, Fastify ou Supabase.
- Toda rota do BFF tem schemas de request e response definidos aqui.
- Exercícios são uma `z.discriminatedUnion('type', \[...])`. Tipos atuais: `sign\_to\_word`, `word\_to\_sign`, `fingerspelling`, `match\_pairs`, `handshape`.
- Imagens são representadas por `SignImage` (`url` + `alt`). Um sinal com movimento usa uma lista de imagens em sequência. O `alt` é só para leitores de tela e não pode entregar a resposta de um exercício; o texto visível de como executar o sinal é a `description` do sinal.
- Conquistas ficam em `achievement.ts`: `Achievement` (o que a conclusão de lição devolve em `achievementsUnlocked`) e `AchievementStatus` (com `progress` e `unlockedAt`, para o perfil).
- Estudos ficam em `study.ts`. Os blocos de uma página também são uma `z.discriminatedUnion('type', \[...])` (`StudyBlock`). Tipos atuais: `heading` (subtítulo dentro da página), `text`, `sign` (rótulo + `SignImageSequence` + `description` opcional, exibida uma vez abaixo de todas as imagens) e `tip`.
- Ao alterar um contrato, atualize o BFF e o app na mesma tarefa.

## Banco de dados

- Toda alteração de schema é feita por migration em `supabase/migrations`. Nunca altere o banco manualmente.
- Tabelas ficam no schema `app`, que não é exposto pela Data API do Supabase. O app nunca acessa o banco diretamente.
- O `payload jsonb` de `exercises` é validado com o schema de `contracts` antes da gravação.
- Sinais ficam em `app.signs` (`id`, `label`, `image\_paths`, `alt`, `description`). A `description` é o texto visível de como executar o sinal, um por sinal (cobre todas as imagens). Fica nula enquanto não for escrita; as das letras aguardam um especialista em Libras.
- Grupos de estudo ficam em `app.study\_groups` (`id`, `title`, `position`). Renomear um grupo é mudar o `title`, nunca o `id`. Um grupo que ainda tem estudos não pode ser apagado (a chave estrangeira não tem cascade): os estudos são movidos antes.
- Estudos ficam em `app.studies` (`id`, `group\_id`, `position`, `title`, `description`, `pages jsonb`). Mover um estudo é trocar o `group\_id`; no seed, o `groupId` em `scripts/seed/content.ts`. O `pages` é validado com `StudyPage` de `contracts` antes da gravação, como o `payload` de `exercises`. Um bloco `sign` guarda a própria cópia do rótulo, das imagens e da `description` do sinal; o seed a monta a partir de `app.signs` (`sign('id')` em `scripts/seed/content.ts`).
- Conexão via pooler do Supabase em modo transação, com prepared statements desativados.
- O schema Drizzle (`shared/infrastructure/db/schema.ts`) espelha as migrations e serve só para tipar as consultas. As migrations são a fonte da verdade: altere os dois juntos.
- O seed (`supabase/seed.sql`) é gerado por `apps/bff/scripts/seed`, que valida os exercícios com `contracts`. Não edite o SQL à mão. O seed faz upsert por id, porque o banco remoto nunca é recriado. O rascunho do CMS só é preenchido pelo seed quando está vazio (ambiente novo): depois disso ele é dos operadores, e o seed nunca recria o que foi apagado nem desfaz o que foi editado.
- **Rascunho do CMS:** o CMS edita só as tabelas `app.draft_courses`, `draft_units`, `draft_lessons`, `draft_exercises`, `draft_signs` e `draft_exercise_signs`, espelhos das publicadas (mesmas colunas e os **mesmos ids**: a linha de rascunho e a publicada com o mesmo id são o mesmo conteúdo). O app continua lendo só as publicadas. "Publicar alterações" (fase 5) compara rascunho e publicado e aplica tudo numa transação. No rascunho a hierarquia tem cascade (apagar um módulo leva as lições e os exercícios dele); um sinal usado por um exercício do rascunho não pode ser apagado (restrict). Ao mudar uma tabela publicada, mude o espelho na mesma migration.
- Imagens de sinais ficam no bucket público `signs` do Supabase Storage (até 1 MB, WebP/PNG/JPEG, limites do próprio bucket). O CMS envia cada imagem direto ao Storage por uma URL assinada que o BFF cria com a chave secreta, sempre num caminho novo (`cms/<id>.<ext>`): um arquivo publicado nunca é sobrescrito. `image_paths` guarda as URLs públicas.
- Operadores do CMS ficam em `app.admins` (`user\_id` do Supabase Auth, `email`, `name`, `active`). Um operador é desativado, nunca apagado. Contas de operador e de aluno são **separadas**: o mesmo projeto Supabase Auth guarda as duas, mas uma conta de operador é criada só pelo BFF, com `app\_metadata.role = 'admin'` (que só a chave secreta grava), e nunca serve como aluno. Como cada e-mail só existe uma vez no Supabase, o operador usa um e-mail diferente do da sua conta de aluno (um alias como `nome+cms@gmail.com` serve).
- Conquistas desbloqueadas ficam em `app.user\_achievements` (`user\_id`, `achievement\_id`, `unlocked\_at`). O `achievement\_id` não tem chave estrangeira: o catálogo é código do BFF. Por isso um id de conquista nunca é renomeado nem reaproveitado.
- A chave secreta do Supabase existe **apenas no BFF** (env do Cloud Run e `.env` local, fora do git). Ela nunca vai para o app, para variáveis `EXPO\_PUBLIC\_\*` nem para o repositório.

## Convenções gerais

- Código, identificadores e nomes de arquivos em **inglês**; textos exibidos ao usuário em **português**.
- Arquivos de componente e classe em PascalCase (`Streak.ts`, `LessonPlayer.tsx`); demais arquivos em camelCase.
- Funções pequenas e com nomes que descrevem a intenção. Prefira early return a aninhamento.
- Nada de `any`. Use `unknown` e valide com Zod quando o tipo vier de fora.
- Comentários explicam o porquê, não o quê.
- Não adicione dependências novas sem necessidade clara; prefira os módulos Expo já listados.
