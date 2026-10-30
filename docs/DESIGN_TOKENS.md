# Design tokens

Valores amostrados diretamente das exportações do Figma (`docs/figma`). Os componentes usam apenas
os tokens semânticos (`bg-card`, `text-muted-foreground`, …), nunca a paleta crua.

## Paleta

| Token           | Hex       | Uso no Figma                                 |
| --------------- | --------- | -------------------------------------------- |
| `--kurio-950`   | `#140d0a` | Fundo da página, texto sobre botão primário  |
| `--kurio-900`   | `#241612` | Cards, sidebar de filtros, modais, footer    |
| `--kurio-850`   | `#2f1d15` | Superfícies elevadas (avatar, ícones)        |
| `--kurio-800`   | `#38220f` | Faixa de contato do footer                   |
| `--kurio-700`   | `#3f2319` | Bordas finas e inputs                        |
| `--kurio-600`   | `#8b5b33` | Divisor do header                            |
| `--kurio-500`   | `#d28a4c` | Botões primários, badges, indicadores ativos |
| `--kurio-400`   | `#e89b55` | Preços, links e abas ativas                  |
| `--kurio-300`   | `#b39463` | Placeholders, preço riscado, texto sutil     |
| `--kurio-200`   | `#cfb28c` | Texto de corpo secundário                    |
| `--kurio-50`    | `#f5f1eb` | Texto principal                              |
| `--kurio-coral` | `#f0805f` | Asterisco de obrigatório e erros             |

## Contraste (WCAG 2.2)

| Par                                 | Razão       | Nível |
| ----------------------------------- | ----------- | ----- |
| Texto principal sobre fundo         | 17.1:1      | AAA   |
| Texto secundário sobre fundo / card | 9.5 / 8.7:1 | AAA   |
| Texto sutil sobre fundo / card      | 6.7 / 6.1:1 | AA    |
| Destaque (preço) sobre fundo / card | 8.5 / 7.7:1 | AAA   |
| Texto escuro sobre botão primário   | 6.9:1       | AA    |
| Erro sobre fundo                    | 7.3:1       | AAA   |

A borda dos inputs do Figma (`#3f2319`, 1.3:1) fica abaixo de 3:1. Para manter fidelidade visual ela
foi preservada, mas todo campo tem label visível, foco com anel `#d28a4c` (6.9:1) e estado de erro
com ícone + texto, sem depender apenas de cor.

## Tipografia

Família única: **Roboto Mono** (variável, self-hosted via `@fontsource-variable/roboto-mono`).

| Papel                 | Tamanho / peso | Exemplo no Figma                 |
| --------------------- | -------------- | -------------------------------- |
| Display (hero)        | 44px / 700     | "SEJA DONO DO FUTURO"            |
| Título de seção       | 28px / 700     | "Diário da Cunhagem"             |
| Título de página/card | 20–28px / 700  | "Emerald Ape #042"               |
| Subtítulo             | 18px / 700     | "Coleções", "Resumo da carteira" |
| Navegação / corpo     | 16px / 400     | Menu principal                   |
| Corpo                 | 14px / 400     | Descrições, labels               |
| Preço                 | 16–18px / 700  | "1.19 ETH"                       |
| Legenda               | 12px / 400     | "Taxa estimada"                  |

## Layout

- Grid de conteúdo de **1200px** centralizado (gutter de 120px em 1440px).
- Breakpoints avaliados: 390 (mobile), 768 (tablet) e 1440 (desktop).
- Raio padrão 6px; cards de arte 20px; botões mobile em pílula.
