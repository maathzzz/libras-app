@AGENTS.md

# App (apps/mobile)

## Estrutura

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
    settings/            # Ajustes (rota `settings`, aberta pela engrenagem do Perfil)
    reminder/            # Lembrete de streak (notificação local)
    streak/
    achievements/        # Conquistas: seção do perfil e card da lição concluída
    profile/
  shared/
    api/client.ts        # Cliente HTTP tipado com contracts
    ui/                  # Design system
    theme/               # Tokens do Claude Design
    lib/                 # storage, haptics, fila offline
```

## Regras de arquitetura

* Arquivos em `src/app/` só compõem telas a partir das features. Nenhuma lógica, chamada de API ou estado neles.
* Uma feature importa apenas de `shared` e do `index.ts` de outras features. Nunca importe arquivos internos de outra feature. Essas fronteiras são verificadas pelo `eslint-plugin-boundaries` (`apps/mobile/eslint.config.mjs`).
* Componentes não chamam a API diretamente: chamam ações do store (`load`, `refresh`, `submit`), que usam as funções de `api/`.
* Toda chamada ao BFF passa por `shared/api/client.ts`, que injeta o token e valida a resposta com `contracts`. Toda falha vira um `ApiError` com `kind`: `network` (sem resposta ou tempo esgotado), `server` (5xx ou resposta fora do contrato, `code: INVALID\_RESPONSE`) ou `request` (4xx, com o `code` do BFF). Os stores usam `isNetworkError` para separar "sem internet" de "erro do servidor".
* Contas de operador do CMS (`app\_metadata.role = 'admin'`) não entram no app: o login as recusa com a mensagem `operatorAccount` e encerra a sessão, e um 403 `OPERATOR\_ACCOUNT` do BFF também encerra a sessão.
* O app usa o Supabase **apenas** para autenticação. Dados de negócio vêm sempre do BFF.
* O cadastro não exige confirmação de e-mail: a opção **Confirm email** fica desativada no Supabase, e o `signUp` já devolve uma sessão que leva o usuário direto ao app. Se o `signUp` voltar sem sessão (a opção foi religada), o app mostra um erro e mantém o usuário no cadastro. Só a recuperação de senha envia e-mail (código de 6 dígitos).
* O app conhece só a chave publicável do Supabase. A chave secreta nunca entra no app: qualquer operação administrativa (como excluir a conta) passa pelo BFF.
* A sessão do Supabase (que pode passar do limite de tamanho por valor do `expo-secure-store`) fica em um MMKV criptografado (`shared/lib/secureStorage.ts`), cuja chave fica no `expo-secure-store`. O MMKV comum é usado só para dados não sensíveis.
* O cliente Supabase (`shared/api/supabase.ts`) usa `EXPO\_PUBLIC\_SUPABASE\_URL` e `EXPO\_PUBLIC\_SUPABASE\_PUBLISHABLE\_KEY`. `client.ts` envia o token no header `Authorization`; diante de um 401 renova a sessão uma vez e repete a requisição, e se a renovação for recusada encerra a sessão.

## Exercícios

* Cada tipo de exercício é um componente em `features/lesson/exercises/`, registrado no registry `Record<ExerciseType, ComponentType<ExerciseProps>>`.
* Para adicionar um tipo: criar o schema em `contracts`, criar o componente e registrá-lo. O player da lição não deve ser alterado.
* A correção local serve apenas para feedback imediato. O resultado oficial vem do BFF.

## Fluxo da lição

1. Buscar o bundle da lição.
2. Fazer `Image.prefetch()` de todas as imagens antes de iniciar.
3. Corrigir respostas localmente para feedback instantâneo.
4. Ao terminar a lição, capturar a `localDate` (data local do aparelho, de `shared/lib/localDate.ts`, montada com os componentes locais e nunca com `toISOString()`, que dá a data UTC).
5. Enviar a sessão com uma `Idempotency-Key` gerada no início da lição e a `localDate`.
6. Em caso de falha de rede ou 5xx, enfileirar o envio no MMKV (com a `localDate`) e reenviar quando houver conexão e sessão ativa. No reenvio, usar a data salva, nunca a data atual. Um 4xx (ou uma resposta fora do contrato) remove a sessão da fila; um 200 do reenvio, inclusive o resultado original devolvido por idempotência, também.
7. Quando o BFF confirma a conclusão (na hora ou pela fila), a home é recarregada.

## Estudos

* A feature `features/study/` tem a aba "Estudar" (`StudiesScreen`, lista por grupo de estudo) e o leitor (`StudyScreen`, rota `study/\[studyId]`, uma página por vez com "Continuar"/"Voltar" e os segmentos do `Header`).
* Ao abrir um estudo, buscar o `StudyGuide` e fazer `Image.prefetch()` das imagens antes de mostrar a primeira página.
* Cada tipo de bloco é um `case` em `features/study/components/StudyBlockView.tsx`. Para adicionar um tipo: criar o schema em `contracts` e o `case` correspondente; o `switch` não tem `default`, então o typecheck aponta o caso que falta.
* Nada é enviado ao BFF ao concluir: "Concluir" só fecha o leitor.
* Os estudos vêm do BFF (`GET /v1/studies` e `GET /v1/studies/:studyId`). Com `EXPO\_PUBLIC\_USE\_MOCKS=true`, `api/studyFixtures.ts` traz o mesmo "Alfabeto manual" do seed, reaproveitando as letras de `features/alphabet`. O texto é provisório e precisa de revisão por especialista em Libras.
* Layout da página (`studyRows` e `signFrameSize` em `components/studyView.ts`): sinais de uma imagem ficam dois por linha; um sinal com várias imagens ocupa a linha inteira, com as imagens lado a lado no mesmo tamanho das imagens dos sinais vizinhos (só encolhem se não couberem). Um sinal que fica sozinho na linha é centralizado. A ordem dos blocos nunca muda. Os demais blocos (`heading`, `text`, `tip`) ocupam a linha inteira.
* A `description` de um bloco de sinal aparece uma vez, abaixo de todas as imagens do sinal. O modal do alfabeto (`HandSignSheet`) mostra a `description` do sinal tocado; o conteúdo do alfabeto continua embarcado no app.

## Lembrete de streak

* Notificação **local** (`expo-notifications`), sem push e sem BFF: a preferência (ligado, horário) fica no MMKV do aparelho. Tudo fica em `features/reminder/`.
* Um gatilho diário repetido não consegue pular um dia, então são agendadas notificações avulsas (gatilho `DATE`) para os próximos 7 dias, com identificador `streak-reminder-YYYY-MM-DD`. O hook `useStreakReminder` (layout raiz) reagenda a janela ao abrir o app, ao entrar na conta e a cada volta ao primeiro plano; ao sair da conta, cancela tudo.
* Concluir uma lição (confirmada pelo BFF ou enfileirada) chama `markLessonDoneForReminder(localDate)`, que reagenda a partir de amanhã. A home com `streak.status === 'done_today'` (lição feita em outro aparelho) tem o mesmo efeito.
* Os reagendamentos rodam em fila no store, para que um reagendamento antigo não recoloque o lembrete de hoje depois de uma lição.
* A permissão **nunca** é pedida na abertura do app. Ela é oferecida uma única vez em `ReminderOffer`, na tela de lição concluída; o pedido do sistema só aparece se o usuário tocar em "Ativar lembrete". Depois disso, o lembrete é ligado, desligado e tem o horário alterado em Ajustes (rota `reminder-time`, com o `DateTimePicker` de `@expo/ui`).

## Conquistas

* Tudo fica em `features/achievements/`. O app não conhece as regras: só mostra o que o BFF manda.
* O perfil mostra `AchievementsSection` (todas as conquistas, desbloqueadas coloridas com a data e bloqueadas em cinza com a barra de progresso). Cada conquista é uma `Medal` (`shared/ui`); ícone e tom saem da `category` (`categoryLooks`), e a bloqueada usa o tom `locked`, como uma lição bloqueada.
* A tela de lição concluída mostra `UnlockedAchievementsCard` quando `achievementsUnlocked` não está vazio. As conquistas entram no anúncio do resultado para leitores de tela, e o háptico toca uma vez para streak e conquistas juntos.
* Quando o BFF confirma uma conclusão (na hora ou pela fila), as conquistas são recarregadas junto com a home. Conquistas de uma lição enviada pela fila aparecem só no perfil. Ao sair da conta, a lista é apagada.

## Tela de módulo

* Segue `docs/design/trilha-modulo-spec.md` (protótipo em `trilha-modulo-referencia.html`): as lições ficam ligadas por uma estrada sobre um cenário de campo (`ModuleScreen` → `TrailMap`, em `features/home`).
* A geometria é toda calculada em `components/trailMapLayout.ts` (posição dos nós, path da estrada, altura, rolagem inicial), com testes. O cenário é dado em `trailSceneryLayout.ts` e se repete a cada 4 lições, então qualquer quantidade de lições funciona. Estrada e cenário são desenhados com `react-native-svg`; as cores ficam em `trailColors` (`shared/theme`).
* O balão "Começar" mostra o título da lição atual. Lições concluídas podem ser refeitas; bloqueadas são anunciadas como desabilitadas. O pulso do nó e a flutuação do balão desligam com "reduzir movimento" (`useReducedMotion`).

## Telas no estilo da trilha

Trilhas (home), Perfil e Lição concluída seguem a linguagem visual da tela de módulo. As peças ficam em `shared/ui`:

* `GameHeader` / `GameFooter`: barra branca fixa com a sombra do cabeçalho do módulo (no topo; embaixo, com o botão principal).
* `Countryside`: fundo fixo de céu e campo (nuvens, colinas, árvores), atrás do conteúdo rolável. Decorativo, oculto para leitores de tela. As formas avulsas (`Tree`, `Cloud`, `Hill`, `Lake`, `Flower`, `SkyGradient`) ficam em `SceneryShapes.tsx` e também desenham o cenário do mapa e a faixa do perfil.
* `Medal`: o nó redondo com borda sólida (tons `success`, `accent`, `warning`, `info`, `locked`), usado em cartões, estatísticas e conquistas. `PulseRing` é o anel pulsante do que fazer agora.
* `MapLabel` (etiqueta branca de seção, como "LIÇÃO 3") e `SegmentBar` (barra com uma parte por lição ou módulo).

Na home, os módulos ficam numa estrada vertical (`ModuleRoad` → `ModuleStation`), verde até o módulo em andamento. As alturas das linhas variam com o texto, então os centros dos nós são medidos na tela e a estrada sai de `moduleRoadLayout.ts` (com testes).

## Imagens

* Sempre use `expo-image` com `cachePolicy="memory-disk"`. Nunca use o `Image` do React Native.
* Toda imagem de sinal tem `accessibilityLabel` a partir do campo `alt`.
* Imagens do alfabeto manual e dos números são embarcadas no app, em `assets/images/hand-signs/` (`letter-a.webp`, `number-1.webp`), importadas em `features/alphabet/content/handSigns.ts` e passadas ao `SignImage` como `BundledSignImage` (`source` + `alt`). Um sinal ainda sem imagem mostra o placeholder. As demais vêm do Supabase Storage.

## Acessibilidade

O público inclui pessoas surdas:

* Nenhuma interação depende de áudio. Todo feedback é visual e háptico (`expo-haptics`).
* Textos em português simples e direto.
* Áreas de toque com no mínimo 44×44 pt.

## Estilo

* `StyleSheet` com tokens de `shared/theme`. Nunca use cores, espaçamentos ou tamanhos de fonte literais nos componentes.
* Não adicione bibliotecas de UI externas.
* Componentes reutilizáveis ficam em `shared/ui` e seguem as telas do Claude Design.

## Configuração

* URL do BFF em `EXPO\_PUBLIC\_API\_URL`.
* Desenvolvimento local: `http://localhost:3000` com `adb reverse tcp:3000 tcp:3000` (refeito sempre que o cabo for reconectado ou o emulador reiniciado), que vale para o emulador e para o celular via USB. Depois de alterar o `.env`, reinicie o Metro.
* `EXPO\_PUBLIC\_USE\_MOCKS=true` faz as funções de `api/` responderem com as fixtures de desenvolvimento (`features/\*/api/\*Fixtures.ts`, com o estado compartilhado em `shared/api/mockServer.ts`), para desenvolver telas sem o BFF. O padrão é `false`. A escolha entre fixture e BFF acontece só dentro de `api/`: telas e stores nunca sabem a origem.
