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
| `StatTile`           | Valor grande + rótulo em caixa tonal (Precisão, Tempo, Dias)             | — |
| `OptionRow`          | Ícone em caixa + título + descrição + valor à direita (nível, meta, trilha em coluna) | — usa `Card` |
| `SignSketch`         | Esboço da mão. No app, será `SignImage` com `expo-image`                 | — |
| `TabBar`             | 3 abas com ícone + rótulo (Trilhas, Alfabeto, Ajustes)                   | — Expo Router `Tabs` |
| `BottomSheet`        | Painel inferior r24 (veredito do exercício, detalhe da letra)            | — |
| `Switch`             | Toggle 46×27, verde quando ligado                                        | — |
| `SegmentedControl`   | Botões lado a lado (velocidade do vídeo)                                 | — fora do MVP |
| `SettingsGroup`      | Card com linhas separadas por divisor                                    | — |
| `TrailNode`          | Nó circular 64pt (feito, atual, bloqueado) sobre um caminho              | — |
| `WeekStreak`         | 7 marcas da semana                                                       | — |
| `TextField`          | Busca r14 sobre `surfaceSubtle`                                          | — |

## Telas

### 1. Boas-vindas
Apresenta o app e leva ao onboarding ou ao login.
**Componentes:** ilustração (`SignSketch` sobre fundo em gradiente), título `hero`, texto `body`, `Pill` ×3 (tags), `Button` primário ("COMEÇAR AGORA"), `Button` secundário ("JÁ TENHO CONTA").

### 2. Nível de conhecimento (onboarding, passo 2 de 3)
O usuário escolhe por onde a trilha começa.
**Componentes:** `ScreenTitle` (kicker "PASSO 2 DE 3"), 3 opções selecionáveis (`Card` tocável com ícone em caixa, título, descrição e tag), `Button` primário ("CONTINUAR"), `Button` ghost ("Voltar").

### 3. Meta diária (onboarding, passo 3 de 3)
O usuário escolhe quantas lições por dia contam para a sequência.
**Componentes:** `ScreenTitle`, 4 opções (`Card` tocável com número em caixa, título, descrição e XP à direita), `Button` primário ("CRIAR MINHA TRILHA").

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

### 11. Alfabeto manual
Consulta de datilologia e números. Mostra a barra de abas.
**Componentes:** `ScreenTitle`, `TextField` de busca, grade 4×N de `Card` tocáveis (`SignSketch` + letra), seção "Números" com a mesma grade, nota de rodapé `caption`, `TabBar`.

### 12. Detalhe da letra/número (sobreposto ao alfabeto)
Mostra o sinal de uma letra ou número.
**Componentes:** `BottomSheet` com overlay, kicker accent ("DATILOLOGIA"/"NÚMERO"), letra em título grande, `IconButton` fechar, card tonal com `SignSketch`, dica `body`, `Button` primário ("PRATICAR DATILOLOGIA").

### 13. Ajustes
Perfil e preferências. Mostra a barra de abas.
**Componentes:** `ScreenTitle`, `Card` de perfil (avatar com iniciais em gradiente, nome, XP e streak, botão pill "Editar"), `SettingsGroup` "HÁBITO DE ESTUDO" (lembrete diário com `Switch`, meta diária com botão "Alterar"), `SettingsGroup` "LIÇÕES", nota de créditos em `surfaceSubtle`, `Button` perigo ("SAIR DA CONTA"), `TabBar`.

## Divergências com o escopo do MVP (CLAUDE.md)

O protótipo inclui itens que o CLAUDE.md coloca fora do escopo ou que conflitam com as regras do app. Eles não devem ser implementados sem decisão explícita:

* **Conquistas** (card "CONQUISTA DESBLOQUEADA" na recompensa, menção na apresentação): fora do escopo.
* **Vídeo do sinal** ("VER MOVIMENTO", "Velocidade do vídeo do sinal"): o MVP usa só imagens. Um sinal com movimento é uma sequência de imagens.
* **Som nos exercícios** (ajuste "Retorno sonoro"): o app não depende de áudio. O feedback é visual e háptico.
* **Bônus de XP por precisão e sequência** (variante "Resumo"): o XP é calculado no BFF. Confirmar a regra antes de exibir o detalhamento.
* **Meta diária de N lições** ("3 de 5 lições", "Faltam 2 lições para manter a sequência"): pelo CLAUDE.md, o streak exige **uma** lição por dia. A meta diária precisa ser alinhada com a regra do streak.
* **Prova do módulo** (trilha): não há tipo de exercício correspondente em `contracts`.
* **Alvos de toque menores que 44pt** no design (fechar 30, toggle 46×27, botão "Editar", chips): os componentes do app garantem 44×44.
