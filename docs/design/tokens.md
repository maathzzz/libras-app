# Tokens de design

Fonte: projeto Claude Design **Libras App v2** (`Libras App v2.dc.html`), design system **Nocturne** (`_ds/nocturne-…/styles.css`).

Implementação: `apps/mobile/src/shared/theme` (`tokens.ts`, `typography.ts`, `elevation.ts`, `fonts.ts`).

## Como o design define o tema

O `styles.css` do Nocturne descreve um tema **escuro** (fundo `#161826`, accent lilás `#9184d9`). O protótipo do app não usa esse tema: ao renderizar, o script de `Libras App v2.dc.html` sobrescreve as variáveis CSS para um tema **claro**:

| Variável CSS       | Nocturne (styles.css) | Valor efetivo no app |
| ------------------ | --------------------- | -------------------- |
| `--color-accent`   | `#9184d9`             | `#1c8ed6`            |
| `--color-bg`       | `#161826`             | `#f2f9fd`            |
| `--color-surface`  | `#232532`             | `#ffffff`            |
| `--color-text`     | `#e9e9ed`             | `#10242e`            |
| `--color-divider`  | `#e9e9ed` a 16%       | `#e2ecf2`            |

As demais cores estão literais no HTML e na paleta do script (`green`, `red`, `orange`, `turq`, `ink`, `muted`, `line`, `paper`). Os tokens abaixo são os valores **efetivamente renderizados**. Do Nocturne vêm a família tipográfica, a escala de títulos e a estrutura de raios e sombras.

`_ds_bundle.js` não exporta nenhum componente (`"components": []`). Os componentes foram identificados pelos padrões repetidos no HTML.

## Cores

### Base

| Token            | Valor     | Uso no design                                   |
| ---------------- | --------- | ----------------------------------------------- |
| `background`     | `#F2F9FD` | Fundo do app                                    |
| `surface`        | `#FFFFFF` | Cards, botão secundário, barra de abas          |
| `surfaceSubtle`  | `#F1F6F9` | Campo de busca, tags neutras, botão "Alterar"   |
| `border`         | `#E2ECF2` | Borda inferior (sombra sólida), trilho do progresso |
| `borderSubtle`   | `#EEF4F8` | Anel de 1px dos cards, divisores de lista       |
| `text`           | `#10242E` | Texto principal (ink)                           |
| `textBody`       | `#33586A` | Texto corrido (dica do sinal, itens de resumo)  |
| `textMuted`      | `#5C7B8A` | Descrições e legendas                           |
| `textSubtle`     | `#6B8695` | Kickers ("PASSO 2 DE 3"), abas inativas, ícone fechar |
| `onColor`        | `#FFFFFF` | Texto sobre cor sólida                          |

### Papéis (cada um com sólido, escuro, suave e borda do suave)

| Papel     | Sólido    | Escuro    | Suave     | Borda do suave | Uso                                           |
| --------- | --------- | --------- | --------- | -------------- | --------------------------------------------- |
| `accent`  | `#1C8ED6` | `#1672AA` | `#E6F3FC` | `#C8E3F7`      | Marca, seleção, XP, aba ativa                 |
| `success` | `#58CC02` | `#47A302` | `#EEF9E0` | `#D7EFBA`      | CTA principal, acerto, progresso, toggle ligado |
| `danger`  | `#E6394A` | `#B32B39` | `#FDECEE` | `#FDD9DD`      | Erro, "Sair da conta"                         |
| `warning` | `#FF9600` | `#CC7800` | `#FFF3E0` | `#FFE4C2`      | Streak (sequência)                            |
| `info`    | `#14BFBA` | `#0F9A96` | `#E4F7F6` | —              | Meta do dia, tag de movimento, gradientes     |

* `accentDark` é a mistura `color-mix(accent 74%, #06212e)` calculada para hex.
* `successLight` `#8AD83F` é o fim do gradiente da barra de meta diária.

### Estados e utilitários

| Token           | Valor                    | Uso                                          |
| --------------- | ------------------------ | -------------------------------------------- |
| `disabled`      | `#EEF4F8`                | Fundo do botão desabilitado                  |
| `disabledEdge`  | `#DFE9EF`                | Borda inferior do desabilitado, toggle desligado |
| `disabledText`  | `#6B8695`                | Texto do desabilitado                        |
| `track`         | `#E2ECF2`                | Trilho de barras de progresso                |
| `locked`        | `#D3E0E8`                | Borda de nó bloqueado da trilha              |
| `lockedSurface` | `#E8F0F5`                | Fundo de nó bloqueado da trilha              |
| `overlay`       | `rgba(16, 36, 46, 0.35)` | Fundo atrás de bottom sheets                 |
| `shadow`        | `#06212E`                | Base escura usada nas misturas de sombra     |

## Tipografia

**Família:** Inter (`--font-heading` e `--font-body`), carregada com `expo-font` a partir de `@expo-google-fonts/inter`.

**Pesos:** 400, 500, 600 e 700. No app, cada peso é uma família própria (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`), porque o Android não sintetiza pesos de fontes carregadas em tempo de execução. Títulos usam 700: o protótipo sobrescreve o 500 de `--font-heading-weight`.

### Escala de tamanhos (`fontSize`)

Os tamanhos fracionários do HTML (10.5, 11.5, 12.5, 13.5, 14.5) foram arredondados para o passo mais próximo da escala.

| Token     | pt | Exemplos no design                               |
| --------- | -- | ------------------------------------------------ |
| `xxs`     | 10 | Rótulo de stat ("PRECISÃO")                      |
| `xs`      | 11 | Kicker, rótulo de aba                            |
| `sm`      | 12 | Legendas, "3 de 5 lições"                        |
| `md`      | 13 | Pills, texto secundário em negrito, botão secundário |
| `base`    | 14 | Corpo de texto                                   |
| `lg`      | 15 | Botão principal, título de opção                 |
| `xl`      | 18 | Palavra no pareamento                            |
| `2xl`     | 21 | Pergunta do exercício, valor de stat             |
| `3xl`     | 25 | Título de tela                                   |
| `4xl`     | 30 | Título de boas-vindas, total do resumo           |
| `5xl`     | 32 | Palavra do sinal novo                            |
| `display` | 58 | XP ganho na recompensa                           |

Escala de títulos do Nocturne (referência, sem uso direto): h1 42, h2 32, h3 25, h4 20, h5 16, h6 13. Corpo 15/1.55.

### Estilos de texto (`textStyles`)

O espaçamento entre letras do design está em `em`; no app foi convertido para pt pelo tamanho de cada estilo.

| Variante      | Peso | Tamanho | Extra                                         |
| ------------- | ---- | ------- | --------------------------------------------- |
| `display`     | 700  | 58      | letter-spacing −0.03em, line-height 1.05      |
| `hero`        | 700  | 32      | −0.025em, line-height 1.12                    |
| `title`       | 700  | 25      | −0.02em                                       |
| `heading`     | 700  | 21      | line-height 1.25                              |
| `subtitle`    | 700  | 15      |                                               |
| `body`        | 400  | 14      | line-height 1.5, cor `textBody`               |
| `bodyStrong`  | 700  | 13      |                                               |
| `caption`     | 400  | 12      | cor `textMuted`                               |
| `kicker`      | 700  | 11      | 0.1em, maiúsculas, cor `textSubtle`           |
| `button`      | 700  | 15      | 0.08em, maiúsculas                            |
| `buttonSmall` | 700  | 13      | 0.08em, maiúsculas                            |
| `link`        | 600  | 13      | cor `textSubtle` (botão "Voltar")             |
| `pill`        | 700  | 13      |                                               |
| `label`       | 700  | 11      | line-height 1.3 (rótulo dos nós da trilha)    |
| `tab`         | 700  | 11      |                                               |

## Espaçamentos (`spacing`)

O Nocturne define uma escala em múltiplos de 2.8px (`--space-1` 2.8 … `--space-8` 22.4), mas o protótipo usa pixels inteiros: 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 16, 18, 20, 22, 24, 26 e 28. A escala abaixo cobre esses valores, juntando os vizinhos (3→2, 5→4, 7→6, 9→8, 13→12, 22→20, 26→24).

| Token | pt | Uso típico                                  |
| ----- | -- | ------------------------------------------- |
| `3xs` | 2  | Título ↔ subtítulo                          |
| `2xs` | 4  | Ícone ↔ texto em pill                       |
| `xs`  | 6  | Gap entre chips/segmentos, padding vertical de pill |
| `sm`  | 8  | Gap de grids pequenos                       |
| `md`  | 10 | Gap entre opções/cards                      |
| `lg`  | 12 | Gap em linhas de card                       |
| `xl`  | 14 | Padding interno de card                     |
| `2xl` | 16 | Margem lateral da tela                      |
| `3xl` | 18 | Padding de bottom sheet                     |
| `4xl` | 20 | Margem lateral de onboarding                |
| `5xl` | 24 | Espaço entre seções                         |
| `6xl` | 28 | Respiro inferior                            |

## Raios de borda (`radius`)

Nocturne: `sm` 4, `md` 8, `lg` 14. O protótipo usa cantos mais arredondados:

| Token  | pt  | Uso no design                                    |
| ------ | --- | ------------------------------------------------ |
| `xs`   | 6   | Segmentos do progresso da lição                  |
| `sm`   | 8   | Barra de meta diária                             |
| `md`   | 12  | Ícone em caixa, botões de velocidade, botão fechar |
| `lg`   | 14  | Cards de stat, campo de busca                    |
| `xl`   | 16  | Botões                                           |
| `2xl`  | 18  | Cards e opções                                   |
| `3xl`  | 20  | Card de destaque (hero)                          |
| `4xl`  | 24  | Topo de bottom sheets                            |
| `pill` | 999 | Pills, chips, toggles                            |

## Sombras e elevação

**Nocturne (tema escuro, sem uso no app):**

* `--shadow-sm`: `0 0 0 1px #3f424d`
* `--shadow-md`: `0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,.55)`
* `--shadow-lg`: `0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,.65)`

**Protótipo (o que o app usa):** relevo "chunky", com uma sombra **sólida, sem desfoque**, deslocada para baixo, na cor "escura" do papel do elemento. Às vezes vem acompanhada de um anel de 1px.

| Token `depth` | pt | Onde                                       |
| ------------- | -- | ------------------------------------------ |
| `sm`          | 3  | Cards estáticos, cards de stat             |
| `md`          | 4  | Opções tocáveis, botões secundários        |
| `lg`          | 5  | Botão principal, card de destaque          |
| `pressed`     | 1  | Estado pressionado                         |

* Ao pressionar, o elemento desce `depth − 1` pt e a sombra cai para 1 pt.
* Exemplos: botão principal `0 5px 0 #47a302`; card `0 3px 0 #e2ecf2, 0 0 0 1px #eef4f8`; opção selecionada `0 4px 0 #c8e3f7`.
* No app: `raised(edgeColor, depth, ringColor?)` e `pressedOffset(depth)` em `elevation.ts`, implementados com `boxShadow` (RN 0.76+, nova arquitetura). O anel usa `spreadDistance: 1`.
* A sombra difusa da moldura do telefone (`0 18px 50px rgba(16,36,46,.14)`) é só apresentação do protótipo e não virou token.

## Outros

| Token                    | Valor | Motivo                                                       |
| ------------------------ | ----- | ------------------------------------------------------------ |
| `sizes.minTouchTarget`   | 44    | Regra de acessibilidade. O design desenha alguns alvos menores (fechar 30, toggle 46×27). |
| `sizes.buttonLg`         | 54    | Botão principal                                              |
| `sizes.buttonMd`         | 48    | Botão secundário                                             |
| `sizes.progressSm/Md`    | 10/12 | Progresso da lição / meta diária                             |
| `sizes.trailNode`        | 64    | Nó circular da trilha                                        |
| `sizes.trailNodeHalo`    | 6     | Halo do nó atual da trilha                                   |
| `opacity.disabled`       | 0.45  | `.btn:disabled` do Nocturne                                  |
| `duration.press`         | 70 ms | `.press` (`transition .07s`)                                 |
| `duration.progress`      | 450 ms| Animação de largura do progresso                             |

## Fora do alcance do `StyleSheet` (pendente)

* **Gradientes** (card de destaque `accent → #14bfba`, avatar, ilustrações, barra de meta `#58cc02 → #8ad83f`): por enquanto viram cor sólida. Decidir depois se vale adicionar `expo-linear-gradient`.
* **Ícones**: o design usa SVG inline. O app usa `expo-symbols` (SF Symbols no iOS, Material Symbols no Android) pelo componente `Icon`.
