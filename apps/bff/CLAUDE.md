# BFF (apps/bff)

## Estrutura

```
src/
  modules/
    profile/          # Perfil
    curriculum/       # Unidades, lições, exercícios, sinais, estudos
    progress/         # Sessões de lição, XP, streak, conquistas
    admin/            # Operadores do CMS e rotas /v1/admin
    authoring/        # CMS: trilhas, módulos, lições, exercícios, sinais e estudos (rotas em /v1/admin)
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

## Regras de arquitetura

- **Regra de dependência:** `http` e `infrastructure` → `application` → `domain`. O domínio nunca importa Fastify, Drizzle, Supabase ou qualquer biblioteca de infraestrutura.
- Um módulo **não importa** `infrastructure` nem `http` de outro módulo. Se um caso de uso precisar de dados de outro módulo, receba uma interface (port) pelo construtor.
- Repositórios são interfaces em `domain/` e implementações em `infrastructure/`.
- Dependências são injetadas pelo construtor e montadas manualmente em `container.ts`.
- Controllers são finos: validam a entrada (via schema), chamam o caso de uso e mapeiam o `Result` para HTTP. Nenhuma regra de negócio no controller.
- Operações que alteram várias tabelas usam uma transação dentro do método do repositório (ex.: `saveCompletion`). Não crie abstração de UnitOfWork.

## Casos de uso

- Uma classe por caso de uso, com um único método público `execute(input)`.
- Nomes no formato verbo + substantivo: `CompleteLesson`, `GetHome`, `UpdateProfile`.
- Erros esperados retornam `Result<T, DomainError>`. Exceções ficam reservadas para falhas inesperadas.
- O tempo atual vem sempre de `Clock` injetado. Nunca use `new Date()` ou `Date.now()` em domínio ou aplicação.

## Regras de domínio

**Streak** (`modules/progress/domain/Streak.ts`):

- O "dia" é a data local do dispositivo (`LocalDate`), no formato `YYYY-MM-DD`. O app a envia no header `X-Local-Date` em todas as requisições e no corpo da conclusão (`localDate`). O BFF não conhece o fuso do usuário.
- O BFF rejeita uma `localDate` mais de 1 dia à frente da data UTC do `Clock` (UTC+14 é o fuso mais adiantado). Datas no passado são aceitas, porque a fila offline envia lições atrasadas.
- Ao concluir uma lição:

  - última atividade hoje → sem alteração;
  - última atividade ontem → `current + 1`;
  - data da conclusão anterior à última atividade → sem alteração (o streak nunca retrocede);
  - caso contrário → reinicia em 1.

- Última atividade depois de hoje (lição antiga vinda da fila offline ou data do aparelho que voltou) → tratada como hoje: status `done\_today`.
- `longest` é sempre o maior valor já atingido.
- Status na leitura: `done\_today`, `at\_risk` (última atividade ontem) ou `broken`. Quando `broken`, o valor exibido é 0.
- O streak é calculado na leitura (lazy). Não crie cron para quebrar streaks.

**XP** (`modules/progress/domain/XpPolicy.ts`):

- 10 XP por lição concluída, com qualquer número de acertos.
- +5 XP de bônus quando o servidor corrige todas as respostas da lição como certas.
- Refazer uma lição já concluída concede XP de novo. Isso incentiva a revisão e mantém a regra simples.
- O XP é calculado sobre a correção do servidor, nunca sobre a do app.
- Uma `Idempotency-Key` repetida não concede XP de novo: o resultado anterior é retornado (passo 1 de `CompleteLesson`).

**Conclusão de lição** (`CompleteLesson`):

1. Se a `Idempotency-Key` já foi processada para o usuário, retornar o resultado anterior.
2. Rejeitar com `LOCAL\_DATE\_TOO\_FAR\_AHEAD` uma `localDate` mais de 1 dia à frente da data UTC do `Clock`.
3. Rejeitar com `LESSON_NOT_FOUND` uma lição inexistente e com `LESSON_LOCKED` uma lição bloqueada para o usuário (mesma regra de `GetLesson`).
4. Recorrigir as respostas no servidor com `AnswerGrader` (`modules/progress/domain/AnswerGrader.ts`). O servidor é a fonte da verdade. Resposta ausente ou duplicada para um exercício conta como incorreta; resposta para exercício fora da lição é ignorada.
5. Calcular o XP.
6. Aplicar a regra do streak com a `localDate`.
7. Verificar as conquistas com o progresso já somado desta lição (ver "Conquistas").
8. Persistir sessão, progresso, `user\_stats` e conquistas desbloqueadas em uma única transação.
9. Retornar XP ganho, streak atual, se o streak aumentou e as conquistas desbloqueadas (`achievementsUnlocked`).

**Conquistas** (`modules/progress/domain/Achievements.ts`):

- O catálogo (15 conquistas) é código: cada uma tem `id`, título, descrição, `category`, uma métrica e um alvo. Só o desbloqueio é gravado (`user\_achievements`). O `id` é persistido: nunca renomeie nem reaproveite um. Títulos e descrições podem mudar.
- Métricas (`AchievementSnapshot`): lições concluídas (contando refeitas), lições sem erro, lições refeitas (conclusões − lições distintas), XP total, **maior** streak (`longest`, para um streak quebrado não perder o progresso), módulos concluídos e trilha concluída. Os contadores ficam em `user\_stats` (`lessons\_completed`, `perfect\_lessons`).
- Um módulo só está concluído quando tem lições e todas foram concluídas; a trilha, quando todos os módulos estão concluídos. Módulos sem lições (em planejamento) impedem a conquista da trilha.
- O único gatilho é `CompleteLesson`: todas as métricas só mudam ali, então não há job. Conquistas cujo alvo foi atingido antes de existirem são desbloqueadas na próxima lição; `GetAchievements` só lê.
- O desbloqueio é permanente e acontece uma única vez (chave primária `(user\_id, achievement\_id)`, `on conflict do nothing`). Uma conquista desbloqueada mostra o progresso cheio, mesmo que a métrica caia (ex.: lição nova num módulo já concluído).
- A resposta guardada para idempotência inclui as conquistas: um reenvio devolve as mesmas, sem desbloquear de novo.

**Desbloqueio de lições** (`modules/progress/domain/LessonUnlocking.ts`):

- A ordem é a da trilha: módulos por posição e, dentro de cada um, lições por posição.
- A primeira lição do primeiro módulo começa disponível. Concluir uma lição libera a seguinte, inclusive a primeira do módulo seguinte.
- Lições concluídas continuam acessíveis. Status: `locked`, `available` e `completed`.
- O aluno só vê conteúdo visível (`visible`, controlado pelo CMS). A Home mostra a trilha **visível** de menor posição. Módulos e lições ocultos ficam de fora, e também lições sem exercícios e módulos sem lições. Como a ordem, o desbloqueio e as conquistas de módulo e trilha vêm da trilha, eles seguem só o conteúdo visível. Uma lição oculta, ou dentro de módulo ou trilha oculta, responde `LESSON_NOT_FOUND`.
- `GetHome` e `GetLesson` ficam no módulo `progress` e leem a trilha pelo port `TrailCatalog`. A implementação (`CurriculumTrailCatalog`, em `progress/infrastructure`) usa o `TrailRepository` do curriculum.

**Estudos** (módulo `curriculum`):

- São conteúdo de leitura: `GetStudies` (lista por grupo de estudo) e `GetStudy` (páginas de um estudo). Não há escrita, correção, XP nem streak. Estudo oculto fica fora da lista e responde `STUDY_NOT_FOUND`.
- Ainda não há cache de currículo: cada requisição lê do banco. O `pages` lido é validado com `StudyGuide`; conteúdo fora do contrato é erro de conteúdo e lança exceção.
- Não bloqueiam lições: a liberação das lições continua decidida só pelo progresso de exercícios.
- Marcar um estudo como visto fica para depois. Quando for feito, a escrita vai para o módulo `progress` e exige `Idempotency-Key`.

## HTTP

- Rotas versionadas em `/v1`.
- Endpoints são moldados pelas telas do app (ex.: `GET /v1/home` agrega trilha, streak e XP).
- Home: `GET /v1/home` (`HomeResponse`, exige `X-Local-Date`). Um usuário sem atividade recebe streak 0 e XP 0.
- Lição: `GET /v1/lessons/:lessonId` (`LessonBundle`). Lição inexistente retorna 404 `LESSON_NOT_FOUND`; lição bloqueada para o usuário retorna 403 `LESSON_LOCKED`.
- Conclusão de lição: `POST /v1/lessons/:lessonId/sessions` (corpo `CompleteLessonBody`, header `Idempotency-Key`, resposta `CompleteLessonResponse`). Header ausente ou que não é UUID retorna 400 `INVALID_IDEMPOTENCY_KEY` (lido com `readIdempotencyKey`, `shared/infrastructure/idempotencyKeyHeader.ts`); corpo inválido, 400 `VALIDATION_ERROR`; lição inexistente, 404 `LESSON_NOT_FOUND`; lição bloqueada, 403 `LESSON_LOCKED`; `localDate` além do limite, 422 `LOCAL_DATE_TOO_FAR_AHEAD`. O reenvio com a mesma `Idempotency-Key` retorna 200 com o resultado original.
- Conquistas: `GET /v1/achievements` (`AchievementsResponse`, todo o catálogo na ordem de exibição, com `progress` e `unlockedAt`). Não exige `X-Local-Date`.
- Estudos: `GET /v1/studies` (aba "Estudar", `StudiesResponse`, agrupada por grupo de estudo; grupos sem estudos ficam de fora) e `GET /v1/studies/:studyId` (`StudyGuide`). Id desconhecido retorna 404 `STUDY_NOT_FOUND`. Não exigem `X-Local-Date`.
- Perfil: `GET /v1/me` (cria o perfil no primeiro acesso, com o nome tirado do e-mail do token), `PATCH /v1/me` (`UpdateProfileRequest`) e `DELETE /v1/me` (exclui os dados no schema `app` e o usuário do Supabase Auth; idempotente, responde 204).
- Toda rota autenticada valida o JWT do Supabase no plugin de auth. O `userId` vem do token, nunca do corpo da requisição.
- O plugin de auth (`shared/infrastructure/auth.ts`) é registrado no escopo `/v1`. Ele verifica a assinatura pelo JWKS do projeto (só ES256/RS256: o segredo HS256 legado é recusado), a expiração, o `iss` (`<SUPABASE_URL>/auth/v1`) e o `aud` (`authenticated`). Token ausente ou inválido retorna 401 `UNAUTHORIZED`; falha ao buscar as chaves retorna 500.
- Escritas sensíveis exigem o header `Idempotency-Key`.
- O app envia a data local do dispositivo no header `X-Local-Date` (`YYYY-MM-DD`) em todas as requisições. As rotas que precisam dele o leem com `readLocalDate` (`shared/infrastructure/localDateHeader.ts`), que retorna 400 `INVALID_LOCAL_DATE` quando ausente ou inválido. A conclusão de lição usa a `localDate` do corpo, capturada quando a lição terminou.
- CMS: rotas em `/v1/admin/*` (módulo `admin`, registradas com o prefixo `/admin`). Contas de operador e de aluno são separadas: o plugin de auth lê `app\_metadata.role` do token (`AuthenticatedUser.operator`, papel `OPERATOR\_ROLE = 'admin'`). Depois do plugin de auth, um hook do escopo chama `AuthorizeAdmin`, que exige as duas coisas: conta de operador **e** linha ativa em `app.admins`; senão, 403 `NOT_ADMIN` (aluno, conta de aluno listada por engano e operador desativado recebem a mesma resposta). As rotas dos alunos (perfil, progresso, estudos) ficam num escopo com o hook `rejectOperatorAccounts`: conta de operador recebe 403 `OPERATOR\_ACCOUNT` e nunca ganha perfil de aluno. `GET /v1/admin/me` (`AdminMeResponse`) devolve o operador. Operadores: `GET /v1/admin/operators` (`AdminOperatorsResponse`, todos, por nome), `POST /v1/admin/operators` (`CreateOperatorRequest`, 201 `TemporaryPasswordResponse`; e-mail que já tem conta, de aluno ou não, recebe 409 `EMAIL_HAS_ACCOUNT`), `PATCH /v1/admin/operators/:userId` (`UpdateOperatorRequest`: nome e `active`; desativar a si mesmo é 422 `CANNOT_DEACTIVATE_SELF`) e `POST /v1/admin/operators/:userId/password` (nova senha temporária; 404 `OPERATOR_NOT_FOUND` para quem não é operador). Respostas com senha vão com `cache-control: no-store`. A conta é criada pela API administrativa do Auth (`SupabaseOperatorAccounts`, port `OperatorAccounts`), confirmada e com `app_metadata.role = 'admin'`; se o operador não puder ser gravado, a conta é apagada. A senha vem do `PasswordGenerator` injetado (`CryptoPasswordGenerator`). Handlers do escopo leem o operador com `currentAdmin(request)`. Rotas de CMS de outros módulos entram no escopo pelo segundo argumento de `adminRoutes` (ex.: `authoringRoutes`), então passam pelo mesmo hook.
- CMS (módulo `authoring`): edita as tabelas que o app lê; não há rascunho. Trilhas, módulos, lições e estudos nascem ocultos e são mostrados ou ocultados com `PUT /v1/admin/{trails,units,lessons,studies}/:id/visibility` (`SetVisibilityRequest`, 204). No código, "módulo" da interface é `unit`.
  - `GET /v1/admin/trails` (`AdminTrailsResponse`, trilhas com módulos e lições em ordem e a contagem de exercícios). Criar: `POST /v1/admin/trails`, `POST /v1/admin/trails/:trailId/units`, `POST /v1/admin/units/:unitId/lessons` (`SaveTitleRequest`, 201 `CreatedResponse`; o item entra no fim da lista). Renomear: `PATCH` e excluir: `DELETE` em `/v1/admin/{trails,units,lessons}/:id` (204). Reordenar: `PUT .../order` na lista (`/trails/order`, `/trails/:trailId/units/order`, `/units/:unitId/lessons/order`) com **todos** os ids na nova ordem (`ReorderRequest`); uma lista que não seja exatamente a atual recebe 422 `INVALID_ORDER`.
  - Os três níveis têm a mesma forma, então os mesmos casos de uso servem a todos (`CreateOutlineItem`, `RenameOutlineItem`, `DeleteOutlineItem`, `ReorderOutlineItems`, com `OutlineLevel`). Item ou pai inexistente: 404 `TRAIL_NOT_FOUND`, `UNIT_NOT_FOUND` ou `LESSON_NOT_FOUND`.
  - Excluir remove o item e tudo abaixo dele. Se algum aluno já fez uma das lições, a exclusão é recusada com 409 `CONTENT_HAS_PROGRESS` (progresso, XP e conquistas ficam): o operador oculta em vez de excluir.
  - Sinais: `GET /v1/admin/signs` (`AdminSignsResponse`, com `exerciseCount`), `POST /v1/admin/signs` (201), `PUT /v1/admin/signs/:signId` (substitui todos os campos, 204), `DELETE /v1/admin/signs/:signId` (409 `SIGN_IN_USE` se um exercício ou estudo o usa). `POST /v1/admin/signs/uploads` (`CreateSignImageUploadRequest`) devolve a URL assinada de upload e a URL pública (`SignImageUploadResponse`); o BFF nunca recebe o arquivo (`SupabaseSignImageStorage`).
  - Exercícios: `GET /v1/admin/lessons/:lessonId/exercises` (`AdminLessonExercisesResponse`, a lição e os exercícios em ordem), `POST /v1/admin/lessons/:lessonId/exercises` (`SaveExerciseRequest`, 201, entra no fim), `PUT /v1/admin/exercises/:exerciseId` (substitui tudo, inclusive o tipo, 204), `DELETE /v1/admin/exercises/:exerciseId` (204) e `PUT /v1/admin/lessons/:lessonId/exercises/order` (`ReorderRequest`, `INVALID_ORDER` como no esboço). Lição ou exercício inexistente: 404 `LESSON_NOT_FOUND` ou `EXERCISE_NOT_FOUND`.
  - O CMS edita `sign_to_word` e `word_to_sign` só escolhendo sinais cadastrados (2 a 4 opções, na ordem que o aluno vê, e a certa entre elas). O BFF monta o `payload` com `buildExercise` (`authoring/domain/CmsExercise.ts`), copiando rótulo e imagens de cada sinal, valida com `Exercise` e regrava `exercise_signs` na mesma transação. O id de cada opção é o id do sinal (como no seed), por isso o `payload` basta para saber quais sinais o exercício usa. Sinal inexistente: 422 `UNKNOWN_SIGN`; duas opções com o mesmo rótulo (sem diferenciar maiúsculas): 422 `AMBIGUOUS_OPTIONS`.
  - Editar um sinal atualiza, na mesma transação, a cópia dele no `payload` de todos os exercícios que o mostram (`withSign`) e nos blocos `sign` dos estudos (`withSignInPages`). Assim nenhum exercício ou estudo fica com imagem antiga. Um sinal usado por um estudo também não pode ser apagado (409 `SIGN_IN_USE`); `AdminSign.studyCount` diz em quantos estudos ele aparece. Estudos não têm tabela de junção: o bloco guarda o `signId` e a busca é por contenção de jsonb (`pages @> ...`).
  - Grupos de estudo e estudos: `GET /v1/admin/studies` (`AdminStudiesResponse`, todos os grupos, vazios também, com os estudos em ordem). Grupos: `POST /v1/admin/study-groups` (`SaveTitleRequest`, 201, no fim), `PATCH` e `DELETE /v1/admin/study-groups/:groupId` (409 `STUDY_GROUP_NOT_EMPTY` enquanto tiver estudos) e `PUT /v1/admin/study-groups/order`. Estudos: `POST /v1/admin/studies` (`SaveStudyRequest`, 201, no fim do grupo), `GET`, `PUT` (substitui tudo; trocar o `groupId` move para o fim do novo grupo) e `DELETE /v1/admin/studies/:studyId`, e `PUT /v1/admin/study-groups/:groupId/studies/order`. Estudo ou grupo da URL inexistente: 404 `STUDY_NOT_FOUND` ou `STUDY_GROUP_NOT_FOUND`; grupo ou sinal do corpo inexistente: 422 `UNKNOWN_STUDY_GROUP` ou `UNKNOWN_SIGN`.
  - No `SaveStudyRequest` um bloco `sign` só nomeia o sinal (`signId`); o BFF copia rótulo, imagens e descrição (`buildStudyPages`). Página nova vem sem `id` e recebe um do `IdGenerator`; página existente mantém o seu.
  - Ids de conteúdo novo vêm do `IdGenerator` injetado (`<prefixo>-<aleatório>`, ex.: `lesson-k3f9x2qa1m`), nunca do título, que pode mudar.
- Formato de erro padronizado: `{ "error": { "code": string, "message": string } }`.

## Configuração

- Variáveis de ambiente validadas com Zod em `shared/infrastructure/env.ts` na inicialização. A aplicação não sobe com env inválido.
- `SUPABASE_URL` dá origem ao JWKS, ao `iss` esperado e à API administrativa do Auth. `SUPABASE_SECRET_KEY` (`sb\_secret\_…`) é usada só na API administrativa (ex.: excluir conta).
- O servidor escuta em `0.0.0.0` e na porta de `process.env.PORT` (exigência do Cloud Run).
- Nenhum estado em memória que precise sobreviver entre requisições, exceto cache de currículo invalidado por `content\_version`.

## Testes

- Casos de uso: testes unitários com repositórios em memória e `Clock` fixo.
- A regra do streak deve ter testes para: primeira lição, mesmo dia, dia seguinte, dia pulado, data anterior à última atividade e virada de mês.
- `CompleteLesson` deve ter testes para: data à frente do limite (rejeitada), data no passado vinda da fila offline (aceita, sem alterar o streak se for anterior à última atividade) e virada de dia.
- A regra do XP deve ter testes para: lição com erros, lição sem erros e lição refeita.
- As conquistas devem ter testes para: alvo atingido, um abaixo do alvo, conquista já desbloqueada, reenvio idempotente e progresso anterior à conquista.
- Repositórios Drizzle: testes de integração contra o Supabase local.
