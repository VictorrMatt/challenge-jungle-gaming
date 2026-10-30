# Kurio — Marketplace de NFTs

Implementação do desafio frontend **NFT Marketplace** em React + TypeScript, fiel ao Figma (desktop e
mobile), com backend **100% simulado na camada de rede** (MSW para REST e Socket.IO), testes E2E e de
regressão visual com Playwright e auditoria Lighthouse versionada.

|                              |                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------- |
| **Demo pública**             | https://challenge-jungle-gaming.vercel.app                                        |
| **Repositório**              | https://github.com/VictorrMatt/challenge-jungle-gaming                            |
| **Arquitetura e decisões**   | [ARCHITECTURE.md](ARCHITECTURE.md)                                                |
| **Contratos REST e eventos** | [docs/API.md](docs/API.md)                                                        |
| **Roadmap da entrega**       | [docs/ROADMAP.md](docs/ROADMAP.md)                                                |
| **Design tokens / assets**   | [docs/DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md) · [docs/ASSETS.md](docs/ASSETS.md) |
| **Lighthouse**               | [lighthouse/reports/summary.md](lighthouse/reports/summary.md)                    |

## Sumário

- [Stack](#stack)
- [Setup](#setup)
- [Comandos](#comandos)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Credenciais fictícias e dados](#credenciais-fictícias-e-dados)
- [Cenários de simulação](#cenários-de-simulação)
- [Como reproduzir os fluxos de falha](#como-reproduzir-os-fluxos-de-falha)
- [Telas e fluxos](#telas-e-fluxos)
- [Testes](#testes)
- [Performance (Lighthouse)](#performance-lighthouse)
- [Deploy](#deploy)
- [Estrutura do projeto](#estrutura-do-projeto)

## Stack

| Responsabilidade       | Tecnologia                                                                   | Onde participa                          |
| ---------------------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| Interface              | React 19                                                                     | `src/`                                  |
| Linguagem              | TypeScript (strict, `noUncheckedIndexedAccess`)                              | todo o código, inclusive testes         |
| Roteamento             | TanStack Router (rotas por arquivo, search params tipados, guard `_private`) | `src/routes`                            |
| Estado remoto          | TanStack Query (cache por usuário, mutations, otimista + rollback)           | `src/features/*/hooks.ts`               |
| Cliente HTTP           | Axios (instância única, validação de contrato, erros normalizados)           | `src/lib/api`                           |
| Integração             | REST APIs com contratos Zod compartilhados                                   | `src/shared/contracts`                  |
| Tempo real             | Socket.IO (`socket.io-client`)                                               | `src/lib/realtime`                      |
| Estilização            | Tailwind CSS v4 + tokens do Figma                                            | `src/index.css`                         |
| Componentes            | shadcn/ui adaptado à identidade Kurio                                        | `src/components/ui`                     |
| Mocking                | MSW (REST via Service Worker + WebSocket com `@mswjs/socket.io-binding`)     | `src/mocks`                             |
| E2E e regressão visual | Playwright (Chromium desktop 1440 e mobile 390)                              | `e2e/`                                  |
| Auditoria              | Lighthouse (3 execuções, mediana)                                            | `scripts/lighthouse.mjs`, `lighthouse/` |

Complementares: Zod (contratos e formulários), React Hook Form, Sonner (feedback acessível),
Vitest (unitários), oxlint + Prettier, sharp (pipeline de imagens), commitlint.

## Setup

Pré-requisitos: **Node ≥ 22** (`.nvmrc`) e **pnpm 10** (`corepack enable`).

```bash
git clone https://github.com/VictorrMatt/challenge-jungle-gaming.git
cd challenge-jungle-gaming
corepack enable
pnpm install
cp .env.example .env.local   # opcional: os padrões já ativam os mocks
pnpm dev                     # http://localhost:5173
```

Não há backend externo: o app sobe com o servidor simulado (MSW) ativo. Para os testes E2E instale o
Chromium do Playwright uma vez: `pnpm exec playwright install chromium`.

## Comandos

| Comando                                          | O que faz                                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `pnpm dev`                                       | Desenvolvimento com mocks (REST + Socket.IO)                                           |
| `pnpm build`                                     | Gera imagens responsivas, verifica tipos e cria o build de demonstração (com mocks)    |
| `pnpm preview`                                   | Serve o build otimizado (`--port 4173` usado por E2E e Lighthouse)                     |
| `pnpm typecheck`                                 | TypeScript do app, Node e E2E                                                          |
| `pnpm lint` / `pnpm lint:fix`                    | oxlint (react, jsx-a11y, import, typescript) falhando em warnings                      |
| `pnpm format` / `pnpm format:check`              | Prettier com ordenação de classes Tailwind                                             |
| `pnpm test:unit`                                 | Vitest (aritmética ETH e ordenação/deduplicação de eventos)                            |
| `pnpm test:e2e`                                  | Playwright desktop + mobile (sobe build + preview automaticamente)                     |
| `pnpm test:e2e:desktop` / `pnpm test:e2e:mobile` | Apenas um viewport                                                                     |
| `pnpm test:e2e:update`                           | Atualiza as baselines de regressão visual                                              |
| `pnpm test:e2e:report`                           | Abre o relatório HTML (traces das falhas incluídos)                                    |
| `pnpm audit:lighthouse`                          | Lighthouse 3× por página/perfil com mediana (exige `pnpm preview --port 4173` rodando) |
| `pnpm images`                                    | Regera as variantes AVIF/WebP a partir de `assets/images`                              |

## Variáveis de ambiente

Todas opcionais (ver [`.env.example`](.env.example)).

| Variável                   | Padrão       | Descrição                                                                               |
| -------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS`        | `true`       | Ativa o backend simulado (MSW REST + Socket.IO). Também ativo no build de demonstração. |
| `VITE_MOCK_SCENARIO`       | `default`    | Cenário(s) inicial(is), separados por vírgula. `?scenario=` na URL tem prioridade.      |
| `VITE_SHOW_SCENARIO_PANEL` | `true`       | Exibe o painel flutuante de cenários. `?panel=off` oculta por sessão.                   |
| `VITE_API_BASE_URL`        | `/api`       | Base das rotas REST (interceptadas pelo MSW).                                           |
| `VITE_SOCKET_URL`          | mesma origem | Origem do Socket.IO (interceptado pelo MSW no path `/realtime/`).                       |
| `VITE_SESSION_TTL_MINUTES` | `30`         | Duração das sessões criadas pelo servidor simulado.                                     |

## Credenciais fictícias e dados

| Usuário   | E-mail           | Senha        | Dados semeados                                                                     |
| --------- | ---------------- | ------------ | ---------------------------------------------------------------------------------- |
| Nova Sato | `nova@kurio.dev` | `Kurio2026!` | carteira principal (MetaMask/Ethereum) e secundária (Coinbase/Polygon), 1 favorito |
| Theo Lima | `theo@kurio.dev` | `Kurio2026!` | carteira principal (WalletConnect/Ethereum), sem favoritos                         |

- **Cupons:** `KURIO10` (10%), `GENESIS20` (20%), `VERAO2025` (expirado); qualquer outro é inválido.
- **Catálogo:** 36 NFTs determinísticos (os 9 do Figma primeiro) em 9 categorias e 3 redes;
  `Sage Nomad #009` tem a edição 1/1 esgotada; dois NFTs estão totalmente esgotados.
- Senhas são guardadas no mock apenas como **SHA-256 com salt**; nunca em claro.
- Os dados persistem em `localStorage` (refresh mantém carrinho, pedidos, perfil…).
  **Reset completo:** painel “Cenários” › _Resetar dados para o cenário inicial_ ou, no console,
  `await __kurioMock.reset()`.

## Cenários de simulação

Selecione por **URL** (`/?scenario=slow,payment-declined`), pelo **painel “Cenários”** (canto inferior
esquerdo, também no deploy) ou por `VITE_MOCK_SCENARIO`. Cenários são combináveis e determinísticos.

| Cenário            | Efeito                                                               |
| ------------------ | -------------------------------------------------------------------- |
| `default`          | Sucesso com latência realista (80–220 ms)                            |
| `fast`             | Sem latência (testes e auditorias)                                   |
| `slow`             | 2,5 s por requisição (skeletons)                                     |
| `variable-latency` | Latência entre 100 ms e 2 s                                          |
| `out-of-order`     | Respostas do catálogo chegam fora de ordem                           |
| `offline`          | Toda requisição falha na rede                                        |
| `flaky`            | Primeira tentativa de cada leitura falha com 503 (retry automático)  |
| `server-error`     | HTTP 500 em todas as rotas                                           |
| `catalog-error`    | Catálogo falha 2× com 503 e se recupera                              |
| `empty-catalog`    | Catálogo vazio                                                       |
| `session-expired`  | Sessões duram 20 s                                                   |
| `unauthorized`     | Rotas privadas respondem 403                                         |
| `favorites-error`  | Mutations de favoritos falham (rollback otimista)                    |
| `price-change`     | Preço do 1º item muda logo após a cotação                            |
| `sold-out`         | Edição do 1º item esgota logo após a cotação                         |
| `order-timeout`    | Pedido é criado mas a resposta expira (recuperação por idempotência) |
| `payment-declined` | Pagamento recusado                                                   |
| `wallet-rejected`  | Carteira recusa a conexão                                            |

O painel também dispara eventos Socket.IO reais a partir do servidor simulado: **alterar preço**,
**esgotar edição**, **duplicar o último evento**, **enviar evento antigo**, **derrubar a conexão**,
**expirar sessão** e **desconectar carteira**. A mesma superfície está disponível no console como
`window.__kurioMock` (usada pelos testes).

## Como reproduzir os fluxos de falha

1. **Preço muda com item no carrinho (cenário obrigatório de tempo real):** entre como Nova, adicione
   _Emerald Ape #042_ e abra o carrinho. No painel, _Alterar preço_ (id `emerald-ape-042`). O toast
   informa a mudança, o resumo é recalculado, o aviso lista o preço anterior → novo e “Conectar e
   finalizar” fica bloqueado até _Entendi, atualizar carrinho_. No pagamento, altere o preço de novo
   com o diálogo de revisão aberto e confirme: a API responde `409 QUOTE_OUTDATED` e o diálogo reabre
   com os novos valores exigindo nova confirmação.
2. **Pagamento recusado:** `/?scenario=payment-declined` → finalize uma compra → “Pagamento recusado”,
   itens preservados, “Tentar novamente”.
3. **Timeout com recuperação:** `/?scenario=order-timeout` → confirme: após 8 s o cliente reenvia com a
   mesma `Idempotency-Key` e recebe **o mesmo pedido** (nenhuma compra duplicada).
4. **Clique repetido:** clique várias vezes em “Confirmar pagamento” → um único pedido.
5. **Queda de conexão com pedido pendente:** use `/?scenario=default`, confirme e, durante
   “Pagamento em processamento”, _Derrubar conexão_ e recarregue a página: o pedido é retomado e
   termina confirmado, sem duplicidade.
6. **Eventos duplicados/antigos:** no detalhe de um NFT, _Alterar preço_, depois _Duplicar último
   evento_ e _Enviar evento antigo_ (preço 99.99): a interface mantém o preço mais recente.
7. **Sessão expirada no checkout:** no pagamento, _Expirar sessão_ e clique em “Confirmar compra”: login
   com retorno a `/pagamento` e formulário preservado.
8. **Rede lenta / falhas de leitura:** `slow`, `server-error`, `catalog-error`, `offline` mostram
   skeletons, estados de erro com “Tentar novamente” e retries automáticos.
9. **Cupom inválido/expirado, conflito de cadastro e validações:** `NAOEXISTE`, `VERAO2025`;
   cadastro com `nova@kurio.dev`; endereço de carteira `0x123`.

## Telas e fluxos

| Tela             | Rota                   | Destaques                                                                       |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------- |
| Início           | `/`                    | Destaques, busca, filtros combináveis, ordenação e paginação na URL             |
| Detalhe do NFT   | `/nft/$id?edicao=`     | Galeria + zoom, edições, quantidade limitada, favoritos, compra                 |
| Carrinho         | `/carrinho`            | Quantidades, remoção, cupom, resumo da API, avisos em tempo real                |
| Pagamento        | `/pagamento`           | Dados do colecionador, carteiras, rede, conexão simulada, revisão, idempotência |
| Confirmação      | `/pedido/$id`          | Recibo (snapshot imutável), transação e link de explorador simulados            |
| Login / Cadastro | `/entrar`, `/cadastro` | Modal no desktop, tela cheia no mobile, retorno ao fluxo                        |
| Perfil           | `/perfil`              | Dados, avatar, alteração de senha                                               |
| Carteiras        | `/perfil/carteiras`    | Principal e secundária                                                          |
| Favoritos        | `/favoritos`           | Lista de interesse persistida por usuário                                       |

Capturas reais da aplicação (baselines de regressão visual):
[desktop](e2e/__screenshots__/desktop/visual.spec.ts) · [mobile](e2e/__screenshots__/mobile/visual.spec.ts).
Referências do Figma: [docs/figma](docs/figma).

## Testes

- **E2E:** 53 cenários × 2 projetos (Chromium desktop 1440×900 e mobile 390×844) = **106 testes**,
  cobrindo os 12 fluxos exigidos (arquivos `e2e/01…12-*.spec.ts`) + regressão visual (`visual.spec.ts`).
  Cada teste parte de contexto isolado e reset do dataset; REST passa pelos handlers MSW e tempo real
  pelo `socket.io-client`. Relógio controlado (`page.clock`) na expiração de sessão; latência e
  eventos controlados por cenário e pelo `__kurioMock`.
- **Acessibilidade automatizada:** `@axe-core/playwright` (WCAG 2.1 AA) em início, detalhe, carrinho
  e login; verificação de overflow horizontal em 7 telas; foco preso em diálogos; skip link.
- **Unitários:** 15 testes Vitest para aritmética ETH em `bigint` e o `EventGate` (duplicatas/versões).
- **Relatório:** `pnpm test:e2e:report` (HTML com traces, vídeos e screenshots das falhas).

## Performance (Lighthouse)

Build otimizado, cenário padrão dos mocks, 3 execuções por página/perfil, **mediana**
([relatórios HTML/JSON e ambiente](lighthouse/reports)):

| Página  | Perfil  | Performance | Accessibility | Best Practices | SEO |   LCP | CLS |   TBT |
| ------- | ------- | ----------: | ------------: | -------------: | --: | ----: | --: | ----: |
| Início  | mobile  |          55 |           100 |            100 | 100 | 5,1 s |   0 | 1,3 s |
| Início  | desktop |      **96** |           100 |            100 | 100 | 1,3 s |   0 | 87 ms |
| Detalhe | mobile  |          59 |           100 |            100 | 100 | 4,9 s |   0 | 1,2 s |
| Detalhe | desktop |      **98** |           100 |            100 | 100 | 1,2 s |   0 | 20 ms |

Accessibility, Best Practices e SEO atingem 100 em todos os casos e Performance desktop 96–98. A
performance **mobile** (4× CPU simulada) fica abaixo da meta por causa do **backend simulado rodando no
próprio navegador**: o Service Worker do MSW encaminha cada requisição da página ao thread principal,
e o banco em memória, os handlers e a emulação do Socket.IO competem com a renderização. A análise
completa, o que já foi otimizado e o que um backend real eliminaria estão em
[ARCHITECTURE.md › Performance](ARCHITECTURE.md#performance).

## Deploy

O build de demonstração inclui os mocks e funciona em qualquer host estático.
Publicado em **https://challenge-jungle-gaming.vercel.app** (Vercel). A suíte E2E completa roda contra
essa URL pelo workflow `E2E (production)` (diariamente e sob demanda).

**Vercel**: importe o repositório; `vercel.json` já define install/build/output, o
fallback de SPA (acesso direto e refresh em qualquer rota) e cabeçalhos de cache (o
`mockServiceWorker.js` nunca é cacheado). Nenhuma variável é obrigatória.

## Estrutura do projeto

```
src/
  routes/            rotas TanStack (por arquivo); _private = guard de autenticação
  features/          domínio por funcionalidade (catalog, nft, cart, checkout, auth, account, favorites)
  components/        UI compartilhada (layout, feedback, formulários, shadcn/ui adaptado)
  lib/               api (Axios + erros), query (cache/keys), realtime (Socket.IO + EventGate)
  shared/            contratos Zod e aritmética ETH — usados por app E mocks
  mocks/             servidor simulado: db, cenários, handlers REST, Socket.IO, painel
e2e/                 Playwright (12 fluxos + visual) e baselines
lighthouse/          configuração versionada e relatórios
scripts/             pipeline de imagens e auditoria Lighthouse
docs/                API, roadmap, tokens, assets e referências do Figma
```

Commits seguem **Conventional Commits** (validados por commitlint no CI) e estão separados por
responsabilidade; o CI (`.github/workflows/ci.yml`) roda typecheck, lint, format, unitários, build e
E2E em cada push.
