# Tela de módulo — Trilha de aventura (especificação para implementação)

Referência visual: `trilha-modulo-referencia.html` (protótipo estático, 390 px de largura). Os valores abaixo são os do protótipo; adapte unidades ao framework do projeto (px → dp/pt).

## 1. Estrutura da tela

1. **Cabeçalho fixo** (fundo branco, sombra inferior `0 1px 0 #e2ecf2, 0 6px 14px rgba(16,36,46,.06)`), padding `2px 16px 13px`.
2. **Área rolável** com o "mundo" da trilha: fundo em gradiente + decoração + estrada + lições.

## 2. Cabeçalho

- Linha superior (gap 12):
  - Botão voltar 42×42, raio 14, fundo `#ffffff`, sombra `0 3px 0 #e2ecf2, 0 0 0 1px #eef4f8`, ícone chevron 20 px `#10242e`.
  - Bloco de título: kicker `MÓDULO 1 DE 1` (10.5 px, 700, letter-spacing .08em, `#5c7b8a`) + título `Alfabeto e numerais` (21 px, 800, letter-spacing -0.02em, `#10242e`).
  - Pílula de porcentagem: `29%`, fundo `#e6f3fc`, texto `#1270ad`, 13 px 700, padding `6px 11px`, raio 999.
- Barra de progresso segmentada (margin-top 13): **uma parte por lição** (7), `flex: 1`, altura 10, raio 6, gap 4.
  - Concluída: `#58cc02` · Atual: `#9fd0f1` · Bloqueada: `#e2ecf2`.
- Legenda (margin-top 7): `2 de 7 lições concluídas`, 11.5 px, `#5c7b8a`.

## 3. Mundo da trilha (área rolável)

- Largura = largura da tela (390 no protótipo). Altura = `y0 + (n−1)·passo + ~150`.
- Fundo: `linear-gradient(180deg, #dcf0fb 0px, #e9f7e0 230px, #e4f4d6 100%)`.

### 3.1 Posição das lições

- `n` lições, índice `i = 0…n−1`.
- `x(i) = centro − 85` para i par, `centro + 85` para i ímpar (no protótipo: 110 e 280 com largura 390).
- `y(i) = 74 + 128·i`.

### 3.2 Estrada (conecta todas as lições)

Uma curva cúbica entre cada par de lições consecutivas P→Q, com pontos de controle **horizontais**:

```
k  = 0.55
dx = Q.x − P.x
C1 = (P.x + k·dx, P.y)
C2 = (Q.x − k·dx, Q.y)
path += "C C1 C2 Q"
```

Camadas (de baixo para cima), todas com `stroke-linecap: round`, sem preenchimento:

| Camada | Trecho | Cor | Espessura | Observação |
|---|---|---|---|---|
| Borda | todo | `#e2d2ab` | 34 | |
| Leito | todo | `#fbf4e3` | 26 | |
| Linha central | todo | `#d6c398` | 3.5 | `stroke-dasharray: 0.5 12` (pontilhado) |
| Progresso | da 1ª lição até a lição atual | `#58cc02` | 10 | |

Recomendação: gerar o path a partir da lista de lições (SVG / react-native-svg / Canvas), para que o número de lições seja dinâmico.

### 3.3 Nó de lição (botão circular 72×72, centralizado em x,y)

| Estado | Fundo | Ícone | Sombra |
|---|---|---|---|
| Concluída | `#58cc02` | check branco 30 px | `0 6px 0 #47a302` |
| Atual | `#1c8ed6` | play branco 28 px | `0 6px 0 #1170ad, 0 0 0 8px rgba(28,142,214,.20)` + anel pulsante |
| Bloqueada | `#f4f8fa` | cadeado `#5c7b8a` 24 px | `0 6px 0 #c4d3dc` |

- Pressionar (concluída/atual): translateY(3px) por ~70 ms.
- Anel pulsante (atual): borda 3 px `rgba(28,142,214,.55)` a 10 px do nó, escala 0.9 → 1.3 e opacidade 1 → 0, 1.8 s, loop.
- Bloqueada não é clicável; anunciar como desabilitada para acessibilidade.
- Rótulo de acessibilidade: "Lição 3, H a M, disponível" / "concluída" / "bloqueada".

### 3.4 Rótulo da lição (abaixo do nó, top = y + 36 + 12, centralizado em x)

Cartão branco, raio 11, padding `4px 11px 5px`, sombra `0 2px 0 #d6e6c4`:
- Kicker `LIÇÃO N` — 9.5 px, 700, letter-spacing .08em. Cor: concluída `#2f7a00`, atual `#1270ad`, bloqueada `#5c7b8a`.
- Título (ex.: `H a M`) — 12.5 px, 700. Cor `#10242e` (bloqueada `#4d6a79`).

### 3.5 Balão da lição atual (acima do nó)

- 132×44, raio 14, fundo branco, sombra `0 3px 0 #c8e3f7, 0 8px 18px rgba(16,36,46,.10)`.
- Base do balão a 16 px do topo do nó; "rabinho" quadrado 14 px girado 45° no centro inferior.
- Linha 1: `COMEÇAR` — 12 px, 800, letter-spacing .09em, `#1270ad`.
- Linha 2: `+40 XP · 6 sinais` — 10.5 px, 600, `#5c7b8a`.
- Animação: flutuar translateY 0 → −5 px, 2.2 s, ease-in-out, loop.
- Tocar no balão = tocar no nó atual (iniciar lição).

### 3.6 Decoração de fundo (somente nas margens, atrás da estrada)

Elementos decorativos, sem interação e ocultos para leitores de tela. Manter fora da faixa dos nós (aprox. x entre 60 e 330 no protótipo):
- **Colinas**: elipses `#d3edb6` (externa) e `#c3e5a0` (interna), parcialmente fora da tela, alternando esquerda/direita a cada ~250 px.
- **Árvores**: tronco `#a8743a` (6×13), copa círculo r14 `#58cc02` + brilho r6 `#8ad83f`, sombra elíptica `#bfe09a`; escala 0.6–1.0.
- **Nuvens** (só no topo, sobre o céu): 1 elipse + 2 círculos brancos, opacidade .95.
- **Lago**: elipse `#a9d8f2` com reflexo `#c8e8f8`.
- **Flores**: pares de círculos r3/r2.4 em `#ff9600`, `#ffffff`, `#14bfba`, `#ffc23d`.

Sugestão: posicionar a decoração por um padrão que se repete a cada ~4 lições, para funcionar com qualquer quantidade.

## 4. Comportamento

- Ao abrir, rolar automaticamente para deixar a lição atual visível.
- Respeitar "reduzir movimento" do sistema: desligar pulso e flutuação.
- Dados por lição: `numero`, `titulo`, `estado` (`concluida | atual | bloqueada`), `xp`, `qtdSinais`.

## 5. Paleta

| Uso | Cor |
|---|---|
| Texto principal | `#10242e` |
| Texto secundário | `#5c7b8a` |
| Azul (acento) | `#1c8ed6` / escuro `#1170ad` / texto `#1270ad` / suave `#e6f3fc` |
| Verde (concluído) | `#58cc02` / escuro `#47a302` / texto `#2f7a00` |
| Linhas/trilhos | `#e2ecf2` |
| Fonte | Inter (400–800) |
