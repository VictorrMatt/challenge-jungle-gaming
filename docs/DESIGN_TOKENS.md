# Design tokens

Valores conferidos com as variáveis (`color/*`) e estilos de texto do arquivo Figma. Os componentes
usam apenas os tokens semânticos (`bg-card`, `text-muted-foreground`, …), nunca a paleta crua.

## Paleta

| Token                 | Hex       | Variável no Figma       | Uso                                          |
| --------------------- | --------- | ----------------------- | -------------------------------------------- |
| `--kurio-950`         | `#140d0a` | `color/ink`             | Fundo da página, texto sobre botão primário  |
| `--kurio-900`         | `#241612` | `color/surface-card`    | Cards, sidebar de filtros, modais, footer    |
| `--kurio-850`         | `#2f1d15` | `color/surface-raised`  | Botões redondos, avatar, ícones elevados     |
| `--kurio-800`         | `#38220f` | `color/surface-dark`    | Faixa de contato do footer, newsletter       |
| `--kurio-700`         | `#3f2319` | `color/border`          | Bordas finas e inputs                        |
| `--kurio-border-soft` | `#55321f` | `color/border-soft`     | Chips de edição, selo de carteiras           |
| `--kurio-600`         | `#443525` | `color/secondary` 0.3px | Linhas finas (header, tabelas, seções)       |
| `--kurio-500`         | `#d28a4c` | `color/primary`         | Botões primários, badges, indicadores ativos |
| `--kurio-400`         | `#e89b55` | `color/text-accent`     | Preços, links e abas ativas                  |
| `--kurio-amber`       | `#e3a44e` | `color/amber`           | Estrelas de avaliação, avisos                |
| `--kurio-300`         | `#b39463` | `color/secondary`       | Placeholders, preço riscado, texto sutil     |
| `--kurio-200`         | `#cfb28c` | `color/text-secondary`  | Texto de corpo secundário                    |
| `--kurio-50`          | `#f5f1eb` | `color/foreground`      | Texto principal                              |
| `--kurio-coral`       | `#f0805f` | `color/text-coral`      | Asterisco de obrigatório e erros             |
| `--success`           | `#00a66c` | `color/success`         | Carteira conectada, toasts de sucesso        |

As linhas finas do Figma são traços de 0.3px em `color/secondary`; na tela isso se torna um fio de
1px na cor renderizada (`#443525`). O véu dos modais segue o `#140d0a` a 15% do arquivo.

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

Família única: **Roboto Mono** (variável, self-hosted via `@fontsource-variable/roboto-mono`) nos
pesos 400, 500 e 700 usados no Figma. Escala de tamanhos do arquivo: 9, 10, 12, 13, 14, 15, 16, 17,
18, 20, 21, 22, 24, 28, 32 e 43px.

| Papel                 | Tamanho / peso    | Exemplo no Figma                 |
| --------------------- | ----------------- | -------------------------------- |
| Display (hero)        | 43px / 700, lh 70 | "SEJA DONO DO FUTURO"            |
| Título de seção       | 28px / 700        | "Diário da Cunhagem"             |
| Título de página/card | 20–28px / 700     | "Emerald Ape #042"               |
| Subtítulo             | 18px / 700        | "Coleções", "Resumo da carteira" |
| Navegação / corpo     | 16px / 400        | Menu principal                   |
| Listas, labels, info  | 15px / 400–500    | Filtros, labels de formulário    |
| Corpo                 | 14px / 400        | Descrições (lh 24)               |
| Preço                 | 16–18px / 700     | "1.19 ETH"                       |
| Legenda               | 12px / 400        | "Taxa estimada"                  |

## Layout

- Grid de conteúdo de **1200px** centralizado (gutter de 120px em 1440px).
- Breakpoints avaliados: 390 (mobile), 768 (tablet) e 1440 (desktop).
- Raio padrão 6px; cards de arte 20px; botões mobile em pílula.
