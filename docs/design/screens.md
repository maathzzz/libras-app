# Inventário de telas

Fonte: `Libras App v2.dc.html` (protótipo "Sinaliza", nome provisório, 390×800, Android).

Componentes marcados com ✅ já existem em `apps/mobile/src/shared/ui`. Os demais são candidatos para as próximas etapas.

## Componentes recorrentes

| Componente           | Padrão no design                                                         | Status |
| -------------------- | ------------------------------------------------------------------------ | ------ |
| `Button`             | Botão "press" com relevo: primário verde, secundário branco, perigo, texto ("Voltar"), desabilitado | ✅ |
| `Card`               | Superfície branca r18 com relevo; tons accent/success/danger/warning; versão tocável para opções | ✅ |
| `ProgressBar`        | Meta diária (12pt) e segmentos da lição (10pt)                           | ✅ |
| `Header`             | Barra da lição: fechar + segmentos de progresso + pill de XP             | ✅ |
| `Pill`               | Chips de stat (streak, XP, meta) e tags ("5 min por dia", "mão aberta")  | ✅ |
| `IconButton`         | Fechar (lição, bottom sheet)                                             | ✅ |
| `ScreenTitle`        | Kicker + título + descrição                                              | ✅ |
| `Icon`               | Ícones via `expo-symbols`                                                | ✅ |
| `StatTile`           | Valor grande + rótulo em caixa tonal (Precisão, Tempo, Dias)             | ✅ |
| `OptionRow`          | Ícone em caixa + título + descrição + valor à direita (nível, meta, trilha em coluna) | ✅ |
| `SignSketch`         | Esboço da mão. No app, é o `SignImage` (`expo-image` + placeholder com o alt) | ✅ `SignImage` |
| `TabBar`             | 3 abas com ícone + rótulo (Trilhas, Alfabeto, Ajustes)                   | — Expo Router `Tabs` |
| `BottomSheet`        | Painel inferior r24 (veredito do exercício, detalhe da letra)            | ✅ |
| `Switch`             | Toggle 46×27, verde quando ligado                                        | ✅ |
| `SegmentedControl`   | Botões lado a lado (velocidade do vídeo)                                 | — fora do MVP |
| `SettingsGroup`      | Card com linhas separadas por divisor                                    | ✅ `features/settings` |
| `TrailNode`          | Nó circular 64pt (feito, atual, bloqueado) sobre um caminho              | — |
| `WeekStreak`         | 7 marcas da semana                                                       | ✅ `features/streak` |
| `TextField`          | Busca r14 sobre `surfaceSubtle`                                          | ✅ (formulários; a busca do alfabeto ainda usa o próprio input) |

## Telas

### 1. Boas-vindas
Apresenta o app e leva ao onboarding ou ao login.
**Componentes:** ilustração (`SignSketch` sobre fundo em gradiente), título `hero`, texto `body`, `Pill` ×3 (tags), `Button` primário ("COMEÇAR AGORA"), `Button` secundário ("JÁ TENHO CONTA").

No app: "COMEÇAR AGORA" abre o onboarding e "JÁ TENHO CONTA" abre o Login. É a primeira tela de quem não tem sessão, inclusive depois de sair da conta. A ilustração usa o ícone de mão sobre fundo sólido até os gradientes serem definidos.

### 1b. Login (não existe no design)
Formulário de e-mail e senha no estilo das telas de onboarding: `ScreenTitle`, `TextField` ×2 (com ícone e mostrar/ocultar senha), `Button` primário ("ENTRAR") e ghost ("Voltar"). A autenticação está mockada até o projeto Supabase ser configurado (`features/auth/api/authApi.ts`). O token fica no `expo-secure-store` e o `client.ts` o envia no header `Authorization`.

### 2. Nível de conhecimento (onboarding, passo 2 de 3)
O usuário escolhe por onde a trilha começa.
**Componentes:** `ScreenTitle` (kicker "PASSO 2 DE 3"), 3 opções selecionáveis (`Card` tocável com ícone em caixa, título, descrição e tag), `Button` primário ("CONTINUAR"), `Button` ghost ("Voltar").

### 3. Meta diária (onboarding, passo 3 de 3)
O usuário escolhe quantas lições por dia contam para a sequência.
**Componentes:** `ScreenTitle`, 4 opções (`Card` tocável com número em caixa, título, descrição e XP à direita), `Button` primário ("CRIAR MINHA TRILHA").

No app: os passos são Criar conta (1 de 3), Nível (2 de 3) e Meta diária (3 de 3). A tela de conta não existe no design: tem nome, e-mail e senha, com ícone em cada campo e o botão de mostrar/ocultar senha. Ela só valida os campos. A conta é criada no "CRIAR MINHA TRILHA" da meta, então voltar entre os passos nunca cria duas contas. A meta é só um alvo pessoal, então o texto diz que uma lição já mantém a sequência. A coluna de XP foi removida, porque o XP de uma lição depende dos acertos. A mesma tela de meta abre pelos Ajustes ("Alterar").

### 4. Trilhas (início)
Tela principal: stats, próxima lição, meta do dia e trilha de módulos. Mostra a barra de abas.
**Componentes:** linha de `Pill` (streak, XP, meta do dia), `ScreenTitle` (kicker "TRILHA 1 DE 6"), card de destaque (gradiente accent, kicker, título, `Button` branco "CONTINUAR LIÇÃO"), `Card` de meta diária com `ProgressBar`, trilha de `TrailNode`, `TabBar`.
**Variantes do protótipo:**
* layout "Foco" (card de destaque) ou "Painel" (3 `StatTile`: sequência, precisão, sinais);
* trilha em "Caminho" (nós sobre curva), "Coluna" (lista de `OptionRow`) ou "Módulos" (grade 2×N).

### 5. Trilhas, novo usuário
Mesma tela com estado zerado: XP 0, streak 0, primeiro módulo atual e os demais bloqueados. Card de destaque "COMECE POR AQUI".
**Componentes:** os mesmos da tela 4.

### 6. Lição: sinal novo
Apresenta um sinal antes dos exercícios.
**Componentes:** `Header` (fechar, segmentos, pill +XP), kicker "SINAL NOVO", palavra em `hero`, card tonal com `SignSketch` e rodapé, `Pill` ×3 (configuração de mão, movimento, expressão), texto `body` com a dica, `Button` primário ("ENTENDI").

### 7. Exercício: múltipla escolha
"Qual destes sinais significa BOM DIA?" O usuário escolhe uma das 4 imagens de sinal.
**Componentes:** `Header`, kicker, pergunta `heading` com destaque em accent, grade 2×2 (ou lista) de `Card` tocáveis com `SignSketch` + rótulo. Os estados são padrão, acerto (success) e erro (danger). Depois da resposta, abre o `BottomSheet` de veredito.
Corresponde a `sign_to_word`/`word_to_sign` em `contracts`.

### 8. Exercício: pareamento
Ligar 4 sinais às 4 palavras.
**Componentes:** `Header`, kicker, título `heading`, contador "X de 4 pares", duas colunas de `Card` tocáveis (sinal / palavra) com estados padrão, selecionado (accent), par certo (success) e par errado (danger). `Button` primário fica desabilitado até completar ("CONCLUIR EXERCÍCIO").
Corresponde a `match_pairs`.

### 9. Veredito (sobreposto aos exercícios)
Feedback imediato após responder.
**Componentes:** `BottomSheet` tonal (success "Isso!" ou danger "Ainda não"), ícone em círculo, título, XP ganho, explicação e `Button` "CONTINUAR" na cor do veredito.

### 10. Recompensa (lição concluída)
Resumo da lição com XP ganho e streak.
**Componentes:**
* variante "Explosão": confete, check, kicker, XP em `display` e 3 `StatTile` (precisão, tempo, dias);
* variante "Resumo": `Card` com linhas de pontuação e total;
* card de conquista (warning), `Card` com `WeekStreak`, `Button` primário ("VOLTAR À TRILHA") e secundário ("REVISAR OS SINAIS").

No app: variante "Explosão". O tile PRECISÃO mostra os acertos ("5/6"). XP e streak vêm do BFF; enquanto a lição é enviada, aparecem só acertos e tempo. Sem rede, a lição vai para a fila offline e a tela avisa que ela será enviada depois.

### 11. Alfabeto manual
Consulta de datilologia e números. Mostra a barra de abas.
**Componentes:** `ScreenTitle`, `TextField` de busca, grade 4×N de `Card` tocáveis (`SignSketch` + letra), seção "Números" com a mesma grade, nota de rodapé `caption`, `TabBar`.

### 12. Detalhe da letra/número (sobreposto ao alfabeto)
Mostra o sinal de uma letra ou número.
**Componentes:** `BottomSheet` com overlay, kicker accent ("DATILOLOGIA"/"NÚMERO"), letra em título grande, `IconButton` fechar, card tonal com `SignSketch`, dica `body`, `Button` primário ("PRATICAR DATILOLOGIA").

### 13. Ajustes
Perfil e preferências. Mostra a barra de abas.
**Componentes:** `ScreenTitle`, `Card` de perfil (avatar com iniciais em gradiente, nome, XP e streak, botão pill "Editar"), `SettingsGroup` "HÁBITO DE ESTUDO" (lembrete diário com `Switch`, meta diária com botão "Alterar"), `SettingsGroup` "LIÇÕES", nota de créditos em `surfaceSubtle`, `Button` perigo ("SAIR DA CONTA"), `TabBar`.

No app: aba "Ajustes" (a aba "Perfil" continua com a tela provisória). O avatar é sólido até os gradientes serem definidos. Nome e meta vêm do perfil (`GET /v1/profile`, mockado). "Editar" abre a aba Perfil. "Alterar" abre a tela de meta diária. "SAIR DA CONTA" pede confirmação, apaga a sessão e volta às Boas-vindas. O lembrete diário agenda uma notificação local às 20:00 (`expo-notifications`). O grupo "LIÇÕES" (som, velocidade do vídeo, alto contraste) aparece na tela, mas é só visual: os controles não são salvos nem aplicados.

### 14. Estudar (não existe no design)
Lista dos estudos, agrupados por trilha. Mostra a barra de abas, entre "Trilhas" e "Alfabeto".
**Componentes:** `ScreenTitle` ("Estudar"), por trilha um kicker "TRILHA" + título `heading`, e um `Card` tocável por estudo (ícone `study` em caixa `accentSoft`, título, descrição e "N páginas"). Tem estados de carregando e de erro com "Tentar de novo".

Dados de `GET /v1/studies` (mockado). Estudar é recomendado: nada aqui bloqueia ou libera lições.

### 15. Estudo: páginas (não existe no design)
Leitor em tela cheia, uma página por vez.
**Componentes:** `Header` (fechar, um segmento por página), kicker accent "ALFABETO MANUAL · PÁGINA X DE N", título `title`, blocos da página e rodapé com `Button` primário ("CONTINUAR", "CONCLUIR" na última) e `Button` ghost "VOLTAR" a partir da 2ª página.
Blocos:
* `text`: parágrafo `body`;
* `sign`: card `accentSoft`, dois por linha, com rótulo em `heading`, a imagem (ou sequência) do sinal e a dica opcional. Segue a §6 "Sinal novo" em versão compacta;
* `tip`: `Card` warning com ícone de lâmpada.

Dados de `GET /v1/studies/:studyId` (mockado). "Concluir" só fecha o leitor: não envia nada, não dá XP e não conta para o streak.

## Divergências com o escopo do MVP (CLAUDE.md)

O protótipo inclui itens que o CLAUDE.md coloca fora do escopo ou que conflitam com as regras do app. Eles não devem ser implementados sem decisão explícita:

* **Conquistas** (card "CONQUISTA DESBLOQUEADA" na recompensa, menção na apresentação): fora do escopo.
* **"Revisar os sinais"** (recompensa): no protótipo, refaz a lição. Fica de fora até existir um modo de revisão, porque refazer contaria como uma nova conclusão (XP e streak).
* **Vídeo do sinal** ("VER MOVIMENTO", "Velocidade do vídeo do sinal"): o MVP usa só imagens. Um sinal com movimento é uma sequência de imagens.
* **Som nos exercícios** (ajuste "Retorno sonoro"): o app não depende de áudio. O feedback é visual e háptico.
* **Bônus de XP por precisão e sequência** (variante "Resumo"): a regra está no CLAUDE.md. Há bônus só por acertar tudo (+5 XP), não por sequência. O detalhamento fica de fora porque `CompleteLessonResponse` só retorna `xpEarned`.
* **Meta diária de N lições** ("3 de 5 lições", "Faltam 2 lições para manter a sequência"): resolvido. A meta é só um alvo pessoal, exibido no card "Meta de hoje" da home (`HomeResponse.today`). O streak continua exigindo **uma** lição por dia, então os textos não ligam a meta à sequência.
* **Prova do módulo** (trilha): não há tipo de exercício correspondente em `contracts`.
* **Alvos de toque menores que 44pt** no design (fechar 30, toggle 46×27, botão "Editar", chips): os componentes do app garantem 44×44.
