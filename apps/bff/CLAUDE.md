# BFF (apps/bff)

## Estrutura

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

## Regras de arquitetura

* **Regra de dependência:** `http` e `infrastructure` → `application` → `domain`. O domínio nunca importa Fastify, Drizzle, Supabase ou qualquer biblioteca de infraestrutura.
* Um módulo **não importa** `infrastructure` nem `http` de outro módulo. Se um caso de uso precisar de dados de outro módulo, receba uma interface (port) pelo construtor.
* Repositórios são interfaces em `domain/` e implementações em `infrastructure/`.
* Dependências são injetadas pelo construtor e montadas manualmente em `container.ts`.
* Controllers são finos: validam a entrada (via schema), chamam o caso de uso e mapeiam o `Result` para HTTP. Nenhuma regra de negócio no controller.
* Operações que alteram várias tabelas usam uma transação dentro do método do repositório (ex.: `saveCompletion`). Não crie abstração de UnitOfWork.

## Casos de uso

* Uma classe por caso de uso, com um único método público `execute(input)`.
* Nomes no formato verbo + substantivo: `CompleteLesson`, `GetHome`, `UpdateProfile`.
* Erros esperados retornam `Result<T, DomainError>`. Exceções ficam reservadas para falhas inesperadas.
* O tempo atual vem sempre de `Clock` injetado. Nunca use `new Date()` ou `Date.now()` em domínio ou aplicação.

## Regras de domínio

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

**Desbloqueio de lições** (`modules/progress/domain/LessonUnlocking.ts`):

* A ordem é a da trilha: módulos por posição e, dentro de cada um, lições por posição.
* A primeira lição do primeiro módulo começa disponível. Concluir uma lição libera a seguinte, inclusive a primeira do módulo seguinte.
* Lições concluídas continuam acessíveis. Status: `locked`, `available` e `completed`.
* A Home mostra a trilha de menor posição. Módulos sem lições ficam de fora.
* `GetHome` e `GetLesson` ficam no módulo `progress` e leem a trilha pelo port `TrailCatalog`. A implementação (`CurriculumTrailCatalog`, em `progress/infrastructure`) usa o `TrailRepository` do curriculum.

**Estudos** (módulo `curriculum`):

* São conteúdo de leitura: `GetStudies` (lista por trilha) e `GetStudy` (páginas de um estudo). Não há escrita, correção, XP nem streak.
* Fazem parte do cache de currículo invalidado por `content\_version`.
* Não bloqueiam lições: a liberação das lições continua decidida só pelo progresso de exercícios.
* Marcar um estudo como visto fica para depois. Quando for feito, a escrita vai para o módulo `progress` e exige `Idempotency-Key`.

## HTTP

* Rotas versionadas em `/v1`.
* Endpoints são moldados pelas telas do app (ex.: `GET /v1/home` agrega trilha, streak e XP).
* Home: `GET /v1/home` (`HomeResponse`, exige `X-Local-Date`). Um usuário sem atividade recebe streak 0 e XP 0.
* Lição: `GET /v1/lessons/:lessonId` (`LessonBundle`). Lição inexistente retorna 404 `LESSON_NOT_FOUND`; lição bloqueada para o usuário retorna 403 `LESSON_LOCKED`.
* Estudos: `GET /v1/studies` (aba "Estudar", `StudiesResponse`) e `GET /v1/studies/:studyId` (`StudyGuide`). Id desconhecido retorna 404.
* Perfil: `GET /v1/me` (cria o perfil no primeiro acesso, com o nome tirado do e-mail do token), `PATCH /v1/me` (`UpdateProfileRequest`) e `DELETE /v1/me` (exclui os dados no schema `app` e o usuário do Supabase Auth; idempotente, responde 204).
* Toda rota autenticada valida o JWT do Supabase no plugin de auth. O `userId` vem do token, nunca do corpo da requisição.
* O plugin de auth (`shared/infrastructure/auth.ts`) é registrado no escopo `/v1`. Ele verifica a assinatura pelo JWKS do projeto (só ES256/RS256: o segredo HS256 legado é recusado), a expiração, o `iss` (`<SUPABASE_URL>/auth/v1`) e o `aud` (`authenticated`). Token ausente ou inválido retorna 401 `UNAUTHORIZED`; falha ao buscar as chaves retorna 500.
* Escritas sensíveis exigem o header `Idempotency-Key`.
* O app envia a data local do dispositivo no header `X-Local-Date` (`YYYY-MM-DD`) em todas as requisições. As rotas que precisam dele o leem com `readLocalDate` (`shared/infrastructure/localDateHeader.ts`), que retorna 400 `INVALID_LOCAL_DATE` quando ausente ou inválido. A conclusão de lição usa a `localDate` do corpo, capturada quando a lição terminou.
* Formato de erro padronizado: `{ "error": { "code": string, "message": string } }`.

## Configuração

* Variáveis de ambiente validadas com Zod em `shared/infrastructure/env.ts` na inicialização. A aplicação não sobe com env inválido.
* `SUPABASE_URL` dá origem ao JWKS, ao `iss` esperado e à API administrativa do Auth. `SUPABASE_SECRET_KEY` (`sb\_secret\_…`) é usada só na API administrativa (ex.: excluir conta).
* O servidor escuta em `0.0.0.0` e na porta de `process.env.PORT` (exigência do Cloud Run).
* Nenhum estado em memória que precise sobreviver entre requisições, exceto cache de currículo invalidado por `content\_version`.

## Testes

* Casos de uso: testes unitários com repositórios em memória e `Clock` fixo.
* A regra do streak deve ter testes para: primeira lição, mesmo dia, dia seguinte, dia pulado, data anterior à última atividade e virada de mês.
* `CompleteLesson` deve ter testes para: data à frente do limite (rejeitada), data no passado vinda da fila offline (aceita, sem alterar o streak se for anterior à última atividade) e virada de dia.
* A regra do XP deve ter testes para: lição com erros, lição sem erros e lição refeita.
* Repositórios Drizzle: testes de integração contra o Supabase local.
