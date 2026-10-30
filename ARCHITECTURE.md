# Arquitetura, decisões e limitações

Este documento explica **como** a solução atende ao enunciado: contratos, política de sessão,
carrinho, cache, reconciliação REST × Socket.IO, mocks, acessibilidade, performance e desvios do Figma.
Contratos detalhados: [docs/API.md](docs/API.md).

## 1. Visão geral

```
┌────────────────────────── Navegador ──────────────────────────┐
│ UI (React + shadcn/ui + Tailwind)                              │
│   └─ routes/ (TanStack Router: search params Zod, guard)       │
│ features/* hooks ── TanStack Query (cache por usuário)          │
│        │                         ▲                              │
│        ▼ Axios (contratos Zod)   │ setQueryData / invalidate    │
│   lib/api ─────────────► fetch   │                              │
│                           │      lib/realtime (socket.io-client)│
│                           ▼               ▲ WebSocket           │
│ ┌──────────── mocks/ (camada de rede, MSW) ──────────────────┐ │
│ │ Service Worker → handlers REST ──► db (localStorage)        │ │
│ │ ws.link + @mswjs/socket.io-binding ◄── mesmas mutações       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

- **`src/shared/contracts`** é a fonte única de verdade: schemas Zod usados pelo servidor simulado
  (validar entrada) e pelo cliente (validar saída). Tipos de transporte, estado e UI derivam deles.
- **`src/mocks`** é o único lugar com dados fictícios. Componentes, hooks e Axios não têm respostas
  falsas nem caminhos alternativos de negócio: toda regra (preço, disponibilidade, cupom, taxa,
  idempotência, pagamento) vive no servidor simulado.
- Organização por funcionalidade (`features/*`), com UI compartilhada em `components/` e
  infraestrutura em `lib/`.

## 2. Contratos e erros

- Respostas REST são validadas com Zod na borda do Axios (`lib/api/client.ts`). Uma violação vira
  `ApiClientError { kind: 'contract' }` em vez de dados corrompidos na UI.
- Todo erro chega à UI como `ApiClientError` com `kind` (`http`, `network`, `timeout`, `canceled`,
  `contract`), `code` de negócio (`QUOTE_OUTDATED`, `COUPON_EXPIRED`…), `fieldErrors` e `retryable`.
  Formulários mapeiam `fieldErrors` direto para os campos (`applyFieldErrors`).
- Valores ETH trafegam como **strings decimais** e são calculados em `bigint` (wei, 18 casas) em
  `shared/money/eth.ts` — sem `number` em nenhum cálculo monetário. Quantidades são inteiras.

## 3. Sessão

| Aspecto                   | Política                                                                                                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Armazenamento             | Token + usuário em `localStorage` (`kurio:session`); o servidor é a autoridade.                                                                                                                                                                               |
| Refresh                   | Sessão restaurada no boot e revalidada com `GET /auth/session` — enviada só depois que o transporte (MSW) está pronto, nunca durante a avaliação dos módulos.                                                                                                 |
| Expiração                 | Qualquer `401 SESSION_EXPIRED` chama `sessionStore.expire(href)`: um único aviso, guards reavaliados e redirecionamento para `/entrar?redirect=<origem>`.                                                                                                     |
| Checkout                  | O rascunho (formulário, carteira, tentativa de pedido) fica em `sessionStorage` por usuário; após expiração e novo login do mesmo usuário o checkout é retomado.                                                                                              |
| Logout / troca de usuário | Remove **todas** as queries `['user', <id>, …]` do usuário anterior, o carrinho de visitante e os rascunhos de checkout de outras contas (dados pessoais); o `RealtimeClient` fecha o socket antigo (removendo listeners) e abre outro com a nova identidade. |
| Segurança                 | Redirecionamentos só para caminhos internos (`safeRedirect`). Senhas no mock apenas como SHA-256 + salt.                                                                                                                                                      |
| Multi-aba                 | Evento `storage` sincroniza login/logout entre abas.                                                                                                                                                                                                          |

Rotas privadas (`_private`: pagamento, pedido, perfil, carteiras, favoritos) usam `beforeLoad` com
`redirect`, preservando o destino.

**Login/cadastro no desktop.** O modal abre sobre a página em que o colecionador está (a página
continua montada), dirigido pelo parâmetro `auth` declarado na rota raiz. Com _route masking_ a
barra de endereço mostra `/entrar?redirect=…`; recarregar essa URL, um link direto ou o guard de
rotas privadas reabrem o modal sobre a página de `redirect` quando ela é pública (ou sobre a
última página resolvida / início). Fechar remove o parâmetro sem rolar a página; entrar retoma o
`redirect`. No mobile, `/entrar` e `/cadastro` continuam telas cheias (Figma mobile).

## 4. Carrinho

- **Vive no servidor.** Visitantes recebem um `cart.id` (guardado em `localStorage` e enviado em
  `X-Cart-Id`). Ao autenticar, `POST /cart/merge` soma os itens do visitante ao carrinho do usuário,
  respeitando a disponibilidade. O merge é idempotente; o id do carrinho de visitante só é
  esquecido depois de um merge bem-sucedido — se falhar, os itens ficam no servidor, o colecionador
  é avisado e o merge é refeito no próximo boot. Coberto por teste unitário (`merge-guest-cart.test.ts`): o
  Playwright não intercepta requisições atendidas pelo Service Worker do MSW, então a falha é
  simulada na fronteira da API.
- Subtotal, desconto, taxa de rede e total **sempre vêm da API** (`cart.summary`); a UI não recalcula.
- Mutations do carrinho compartilham `scope: { id: 'cart' }` no TanStack Query: rodam em série, então
  cliques rápidos nunca resolvem fora de ordem.
- Cada item guarda o `acknowledgedUnitPrice`. Se o preço/disponibilidade mudar, o servidor devolve
  `notices` (`PRICE_CHANGED`, `QUANTITY_REDUCED`, `SOLD_OUT`) e o checkout fica bloqueado até o
  colecionador reconhecer (`POST /cart/acknowledge`).

## 5. Checkout e pedidos

1. **Conexão simulada da carteira:** `POST /checkout/wallet-sessions` (aceita, recusa por cenário,
   desconexão pelo painel). Pedido com sessão desconectada → `409 WALLET_DISCONNECTED`.
2. **Revisão:** `POST /checkout/quote` congela linhas, cupom, taxa e total com um `fingerprint`.
3. **Confirmação:** `POST /orders` com `Idempotency-Key`. O servidor **revalida** preço,
   disponibilidade, cupom e taxa; se algo mudou responde `409 QUOTE_OUTDATED` com a nova cotação e a
   UI exige nova confirmação.
4. **Idempotência no cliente:** a chave e o corpo exato da tentativa são persistidos _antes_ do envio.
   Timeout/rede → reenvio automático (até 2×) com a mesma chave. Refresh no meio do envio → a página
   reenvia a tentativa persistida e recebe o mesmo pedido. Mesmo corpo = mesmo pedido; corpo
   diferente com a mesma chave = `409 IDEMPOTENCY_CONFLICT`.
5. **Acompanhamento:** pedido nasce `pending`; `order.updated` (privado) leva a `confirmed` ou
   `declined` (terminais). Polling de 4 s é a rede de segurança se um evento se perder.
6. **Resultado:** o recibo só aparece para pedido `confirmed` pela simulação e reproduz o _snapshot_
   do pedido (mudanças posteriores no catálogo não o alteram). Na confirmação, o servidor baixa a
   disponibilidade e remove do carrinho **apenas** os itens/quantidades comprados; na recusa o
   carrinho fica intacto.

## 6. Estratégia de cache, retries e sincronização

| Política             | Valor                                          | Motivo                                                                                                                    |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `staleTime` padrão   | 30 s                                           | Catálogo é mantido fresco por `nft.updated`; dados privados são invalidados explicitamente.                               |
| `gcTime`             | 5 min                                          | Voltar/avançar renderiza instantaneamente do cache.                                                                       |
| Carrinho `staleTime` | 10 s                                           | Reflete mudanças de outras abas rapidamente.                                                                              |
| Retries de queries   | até 2×, backoff exponencial (500 ms → 4 s)     | Só para falhas transitórias (`retryable`: rede, timeout, 5xx). 4xx nunca.                                                 |
| Retries de mutations | nenhum                                         | Operações não idempotentes não podem duplicar. O pedido tem retry próprio com chave de idempotência.                      |
| Paginação            | `placeholderData: keepPreviousData`            | Sem “pisca” ao trocar página/filtro; o resultado anterior fica opaco.                                                     |
| Respostas obsoletas  | `AbortSignal` + chave por parâmetro            | Requisições superadas são canceladas; uma resposta antiga nunca escreve no cache da chave atual (cenário `out-of-order`). |
| Isolamento           | `['user', userId, …]`                          | Dados privados nunca são compartilhados entre contas; logout remove tudo de uma vez.                                      |
| Prefetch             | loaders do Router + `defaultPreload: 'intent'` | Hover/foco em links já busca código e dados.                                                                              |
| Otimismo             | Favoritos                                      | `onMutate` aplica, `onError` restaura o snapshot e avisa, `onSettled` reconcilia.                                         |

## 7. Tempo real e reconciliação REST × Socket.IO

- **Transporte:** `socket.io-client` real, conectado ao servidor simulado por
  `ws.link` + `@mswjs/socket.io-binding` no path **`/realtime/`** (um path dedicado evita capturar o
  WebSocket do HMR do Vite).
- **Envelope:** `{ eventId, type, resource: { type, id }, version, occurredAt, payload }`.
- **`EventGate`** (testado em `event-gate.test.ts`) descarta duplicatas (`eventId` já visto) e eventos
  antigos (`version` ≤ última aplicada daquele recurso), então nada regride nem é reaplicado.
- **`nft.updated`** (público) corrige catálogo, detalhe e listas relacionadas via `setQueryData` e
  invalida o carrinho se o NFT estiver nele (o resumo é do servidor), com aviso acessível.
- **`order.updated`** (privado, roteado só para sockets do dono) atualiza o status e refaz o
  `GET /orders/:id` (a fonte de verdade do recibo é REST).
- **Reconexão:** ao reconectar, catálogo, detalhe, carrinho e pedidos ativos são reconciliados com a
  API (eventos perdidos durante a queda são recuperados). Um banner informa a perda de conexão.
- **Ciclo de vida:** um socket por sessão; logout/troca de usuário remove listeners e reinicia o
  `EventGate`; o servidor só entrega `order.updated` ao usuário dono.
- **Coerência:** toda mudança de catálogo passa por `updateNft()` no mock, que atualiza o banco,
  incrementa a versão e emite o evento — REST e eventos nunca divergem.

### Limitações do transporte nos mocks

- Só o transporte `websocket` pode ser interceptado; o cliente desliga o long-polling.
- O binding não implementa salas/namespaces: o servidor simulado mantém o próprio registro de
  conexões e faz o roteamento por usuário.
- Heartbeats do Engine.IO são emulados (ping a cada 25 s) para o cliente não expirar a conexão.
- `engine.io-client` captura o `WebSocket` global ao ser importado; por isso o `socket.io-client` é
  importado **depois** que o MSW está ativo (`RealtimeClient.connect` faz import dinâmico). Esse bug
  foi detectado pelos testes E2E no build de produção e corrigido.
- Uma conexão recusada durante uma queda simulada expira (timeout de 5 s) antes da próxima tentativa,
  comportamento semelhante a um servidor inalcançável.
- O servidor simulado roda na mesma aba: não há eventos entre abas diferentes (cada aba tem seu
  “servidor”, ambos persistindo no mesmo `localStorage`).

## 8. Mocks (MSW)

- **Ativação por configuração** (`VITE_ENABLE_MOCKS`, padrão ligado) e presente no build de
  demonstração. O worker inicia em paralelo com o app: o primeiro frame (shell, hero, skeletons) é
  pintado logo, e um _gate_ de transporte (`lib/api/transport.ts`) segura toda requisição Axios e a
  conexão Socket.IO até o MSW estar ativo — nada sai para a rede antes de poder ser interceptado. O
  gate não conhece os mocks (recebe só uma promise) e, sem mocks, já nasce resolvido.
- **Banco** em memória com persistência em `localStorage` (`kurio:mock-db`) e reset determinístico
  (seed fixa, PRNG `mulberry32`). Pedidos pendentes retomam a liquidação após refresh.
- **Cenários** combináveis aplicados por um wrapper único `route()`: latência (fixa/variável/fora de
  ordem), falhas (rede, timeout, 4xx/5xx, só nas N primeiras tentativas) e regras de negócio.
- **Painel de cenários** (extra) e `window.__kurioMock` expõem controles que só alteram o servidor
  simulado; as mudanças chegam à UI pelos caminhos normais (REST/Socket.IO).

## 9. Acessibilidade

- Skip link, landmarks, títulos hierárquicos, `aria-current` na navegação e na paginação.
- Diálogos e drawers (Radix) com foco preso e retorno de foco; Esc fecha.
- Campos com label (visível ou `sr-only` quando o Figma usa só placeholder), `aria-invalid`,
  `aria-describedby` para erro/dica e marcador de obrigatório anunciado.
- Feedback de mutations e de tempo real por Sonner (região `aria-live`) e regiões `role="status"`.
- Estados não dependem só de cor: edições esgotadas riscadas + “(esgotada)”, erros com ícone + texto.
- `prefers-reduced-motion` desliga shimmer e transições.
- Touch targets ≥ 24 px (os pontos do carrossel mantêm 8 px visuais dentro de alvos de 24 px).
- Verificado com axe (WCAG 2.1 AA) e checagem de overflow horizontal nos E2E.

**Ajustes em relação ao layout:** o contraste da borda dos inputs do Figma (`#3f2319`, 1,3:1) foi
mantido por fidelidade, compensado por labels, foco de 6,9:1 e erros textuais
(ver [docs/DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md)). Diálogos usam overlay escurecido para dar
contexto de foco (o Figma mostra o fundo sem escurecer).

## 10. Performance

Medianas de 3 execuções ([lighthouse/reports/summary.md](lighthouse/reports/summary.md)):
desktop **94–96** em início e detalhe; mobile **58**; Accessibility, Best Practices e SEO **100** em todos.

**O que já foi feito:** code splitting por rota (TanStack Router), preload por intenção, imagens
AVIF/WebP responsivas com `srcset`/`sizes` e `fetchpriority="high"` no LCP, dimensões reservadas
(CLS 0), fonte variável self-hosted com `font-display: swap`, app e mocks carregados em paralelo
com o primeiro frame pintado antes de o worker terminar de iniciar (gate de transporte),
`socket.io-client` sob demanda, painel de cenários em chunk lazy, cabeçalhos de cache imutável.

**Por que o mobile fica abaixo de 90:** a auditoria usa o cenário padrão dos mocks, como pede o
enunciado, e o backend simulado roda no thread principal do mesmo navegador sob CPU 4× mais lenta:

- o Service Worker do MSW encaminha **toda** requisição da página (inclusive imagens e chunks) ao
  thread principal para decidir se há handler, atrasando o carregamento do LCP (_resource load delay_
  ~0,9–1,2 s nos relatórios);
- o chunk dos mocks (MSW + banco + handlers + emulação Socket.IO) responde pela maior parte do
  _bootup time_ (de ≈ 2,1–2,7 s de scripting simulado no início mobile);
- o LCP depende de dados da “API”, que só existe depois que o worker inicia.

Medido e descartado: pintar antes do worker iniciar rendeu ~+3 pontos no início mobile (mantido,
pois também melhora a experiência); Zod em modo `jitless` não teve ganho mensurável (revertido).

Com um backend real esse custo sai do cliente (os mesmos componentes medem 94–96 no desktop). Não foram
aplicadas simplificações exclusivas para a auditoria (o painel e os mocks continuam ativos).

## 11. Desvios e decisões de UX em relação ao Figma

| Ponto                                                                                                           | Decisão                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artes de NFT, banners e blog                                                                                    | Ilustrações originais do Figma, recortadas por uso e otimizadas em AVIF/WebP ([docs/ASSETS.md](docs/ASSETS.md)).                                      |
| Contagens dos filtros (ex.: “Arte digital (33)”)                                                                | Calculadas dos dados reais do mock (36 NFTs) para filtros coerentes.                                                                                  |
| Card sem nome no Figma (3ª linha)                                                                               | Recebeu “Golden Pulse #233”.                                                                                                                          |
| Pagamento: campos de carteira                                                                                   | Endereço/tipo/ENS secundário vêm da carteira cadastrada selecionada (somente leitura) para garantir o uso das carteiras cadastradas.                  |
| Pagamento: confirmação                                                                                          | Um diálogo de revisão com a cotação do servidor antecede o pagamento (exigido pelo enunciado).                                                        |
| Mobile: pagamento                                                                                               | O Figma mobile não mostra o formulário; ele aparece em uma seção recolhível “Dados do colecionador”, preenchida automaticamente.                      |
| Avisos de tempo real e estados vazios/erro/skeleton                                                             | Não desenhados; seguem tokens e componentes do sistema.                                                                                               |
| Seções fora do escopo (Atividade, Ofertas, Downloads, Suporte, blog, newsletter, login social, recuperar senha) | Visíveis como no Figma, mas indicam “em breve” / indisponível, sem simular sucesso.                                                                   |
| “Criadores” e “Aprenda” no menu                                                                                 | Levam às seções correspondentes da página inicial.                                                                                                    |
| Filtros em tablet/mobile                                                                                        | Gaveta lateral (Sheet) acionada pelo botão de filtros.                                                                                                |
| Dica de senha no cadastro                                                                                       | Adicionada (regra de senha visível antes do erro).                                                                                                    |
| Selo "Raro/Lendário" nos cards                                                                                  | Exibido só no mobile, como no Figma (o grid desktop não tem selo).                                                                                    |
| Pontos de carrossel em "Mais desta coleção"                                                                     | Omitidos: as cinco obras cabem na largura, e pontos sem função seriam enganosos.                                                                      |
| Botão "-" no limite de quantidade                                                                               | Mantém o laranja do Figma; só o ícone esmaece, e o botão fica desabilitado para tecnologia assistiva.                                                 |
| Links "Crie uma conta" / "Entre"                                                                                | Em cor de destaque (o Figma usa a mesma cor do texto), para que o link não dependa só do contexto.                                                    |
| Movimento e microinterações                                                                                     | Não especificados no Figma; adicionados de forma discreta (transições de rota, progresso, fade de imagens) e desligados com `prefers-reduced-motion`. |
| Data no recibo                                                                                                  | Formato do Figma (“29 Jul, 2026”), mês em português.                                                                                                  |

## 12. Testes

- 12 suítes funcionais + visual, desktop e mobile, 108 testes no total; cada teste isola contexto e
  dataset. A regressão visual roda na imagem Docker oficial do Playwright (ambiente de referência
  das baselines, também usado pelo CI); fora dela é pulada com o motivo, nunca falha por fonte. Tempo real via `socket.io-client`, REST via handlers MSW, relógio controlado onde há
  dependência de tempo (expiração de sessão por TTL).
- A suíte encontrou e motivou correções reais: WebSocket fora do MSW em produção, overflow no perfil
  mobile, `isDirty` não inscrito no formulário de perfil, toasts cobrindo ações no mobile e
  notificações duplicadas na expiração de sessão.
