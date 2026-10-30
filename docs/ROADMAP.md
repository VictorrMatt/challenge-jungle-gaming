# Roadmap de entrega — Kurio NFT Marketplace

Documento vivo que organiza a entrega em fases pequenas, revisáveis e rastreáveis por commit.
Cada fase termina com build, lint e typecheck verdes e com commits semânticos em inglês
(`feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`, `style`).

Legenda: ✅ concluída · 🚧 em andamento · ⏳ pendente · ⛔ bloqueada

## Mapa de pontuação → fases

| Critério (pontos)                     | Fases que entregam a evidência |
| ------------------------------------- | ------------------------------ |
| Fidelidade visual e responsividade 20 | F2, F6–F10, F13 (visual)       |
| Fluxos e experiência de uso 20        | F6–F10                         |
| Integração e estado 15                | F3, F5, F6–F10                 |
| Tempo real 10                         | F4, F11                        |
| Mocking 10                            | F4                             |
| Testes 10                             | F13                            |
| Acessibilidade 5                      | F2, F12, F13 (axe)             |
| Performance 5                         | F14                            |
| Arquitetura e documentação 5          | F0, F15, F16                   |

Critérios **eliminatórios** que guiam todas as fases: stack obrigatória com uso efetivo, nenhum
fluxo apenas visual, compra confirmada somente via resposta da simulação, isolamento de dados entre
usuários, eventos nunca simulados direto na UI e E2E executáveis.

## Fases

### F0 — Planejamento ✅

- Leitura do enunciado, inventário das 15 telas do Figma e deste roadmap.

### F1 — Base do projeto ✅

- Vite + React 19 + TypeScript (strict, `noUncheckedIndexedAccess`), pnpm com lockfile.
- Tailwind v4, alias `@/`, fundação shadcn/ui (`components.json`, `cn`, tokens semânticos).
- oxlint (react, jsx-a11y, import, typescript), Prettier com ordenação de classes, editorconfig.

### F2 — Design system Kurio ⛔ (aguarda acesso visual ao Figma)

- Tokens extraídos do Figma: paleta, tipografia, escala de espaçamento, raios, sombras.
- Fontes self-hosted (woff2, `font-display: swap`, preload) e assets otimizados (AVIF/WebP + `srcset`).
- Componentes shadcn adaptados à identidade: Button, Input, Field, Select, Dialog, Sheet/Drawer,
  Tabs, Pagination, Breadcrumb, Badge, Avatar, Skeleton com shimmer, Sonner.
- Shell: Header, Footer, Tab bar mobile, layout responsivo (390 / 768 / 1440).

### F3 — Domínio e contratos ⏳

- Tipos de domínio e schemas Zod compartilhados entre MSW, Axios e UI (contrato único).
- Biblioteca de valores ETH em string decimal com aritmética em `bigint` (sem `number`).
- Envelope de erro padronizado: validação, sessão inválida, permissão, não encontrado,
  conflito de disponibilidade, falha transitória.
- `docs/API.md` com todos os endpoints e eventos.

### F4 — Backend simulado (MSW + Socket.IO) ⏳

- Banco em memória com persistência em `localStorage` e reset para cenário conhecido.
- Fixtures: ~48 NFTs (filtros/paginação com variedade), 2+ usuários, cupons válido/expirado.
- Handlers REST de sessão, NFTs, favoritos, carrinho, cotação, pedidos, perfil e carteiras.
- Motor de cenários configurável por `?scenario=`, variável de ambiente e painel de dev:
  latência fixa/variável, respostas fora de ordem, timeout, offline, 4xx/5xx, sessão expirada,
  conflito de cadastro, cupom inválido/expirado, preço alterado, edição esgotada,
  timeout pós-criação de pedido, pagamento confirmado/recusado.
- `@mswjs/socket.io-binding` emitindo `nft.updated` e `order.updated` a partir das mesmas mutações
  do banco (REST e eventos sempre coerentes).

### F5 — Infra do app ⏳

- Axios: instância única, `AbortSignal`, normalização de erros tipados, header de sessão,
  interceptor de 401 → expiração.
- TanStack Query: política de cache/retry documentada, query keys por usuário e parâmetros,
  `placeholderData` para paginação, descarte de respostas obsoletas.
- TanStack Router: rotas por arquivo, search params validados com Zod, guards de autenticação com
  `redirect` preservando a origem, 404 e error boundaries por rota.

### F6 — Conta e sessão ⏳

- Login e cadastro (modal desktop / tela mobile) com validação e conflito de cadastro.
- Sessão recuperável após refresh, expiração durante navegação e checkout com retomada.
- Logout e troca de usuário limpam cache privado e desconectam subscriptions.

### F7 — Catálogo e detalhe ⏳

- Início: destaques, catálogo, busca (debounce), filtros combináveis, ordenação, paginação na URL.
- Detalhe: galeria, edições, quantidade com limite, favoritos (update otimista + rollback), compra.
- Estados: skeleton shimmer, vazio, erro com retry, NFT inexistente, edição indisponível.

### F8 — Carrinho ⏳

- Carrinho de visitante persistido e mesclado ao autenticar.
- Quantidades por NFT/edição respeitando disponibilidade, remoção, cupom, resumo da cotação.
- Alterações de preço/disponibilidade via `nft.updated` anunciadas e refletidas no resumo.

### F9 — Pagamento e confirmação ⏳

- Formulário validado, carteiras cadastradas, rede, simulação de conexão/recusa/desconexão.
- Revisão com nova cotação; mudanças exigem reconfirmação.
- Pedido idempotente (chave persistida por tentativa), estados pendente/confirmado/recusado,
  recuperação após refresh/reconexão, recibo como snapshot imutável.
- Remoção do carrinho apenas dos itens/quantidades comprados.

### F10 — Perfil e carteiras ⏳

- Perfil, avatar (upload com preview e validação), alteração de senha (hash no mock).
- Carteiras principal e secundária com validação de endereço `0x` e ENS.

### F11 — Tempo real robusto ⏳

- Eventos com `eventId`, `resource`, `version`: deduplicação e descarte de versões antigas.
- Reconciliação via REST após reconexão; isolamento por sessão; cleanup de listeners.

### F12 — Acessibilidade ⏳

- Foco visível, trap em diálogos/drawers, skip link, landmarks, labels e erros associados.
- Live region para mutações e eventos em tempo real; estados não dependentes só de cor.

### F13 — Testes Playwright ⏳

- 12 cenários do enunciado em Chromium desktop e mobile, estado isolado por teste,
  relógio controlado, eventos disparados pelo cliente Socket.IO.
- Regressão visual (início, detalhe, carrinho, pagamento) com baselines versionadas.
- Relatório HTML e traces em falha.

### F14 — Performance e Lighthouse ⏳

- Auditoria início e detalhe, mobile e desktop, 3 execuções com mediana, relatórios HTML/JSON,
  LCP/CLS/TBT registrados e justificativas.

### F15 — Deploy e documentação ⏳

- Deploy Vercel com rewrites de SPA e mocks ativos no build de demonstração.
- `README.md` (setup, env, credenciais, cenários, comandos, falhas) e `ARCHITECTURE.md`.

## Extras assumidos para elevar a nota

Itens além do mínimo, assumidos como demanda nossa da entrega:

| Extra                                                                    | Critério reforçado         |
| ------------------------------------------------------------------------ | -------------------------- |
| Painel de cenários visível no deploy (troca de cenário, reset, eventos)  | Mocking, Documentação      |
| Validação de contratos em runtime com Zod na borda do Axios              | Integração e estado        |
| Testes unitários (Vitest) de ETH decimal, versionamento de eventos, cart | Arquitetura, Tempo real    |
| `@axe-core/playwright` em todas as telas principais                      | Acessibilidade, Testes     |
| GitHub Actions: typecheck, lint, unit, E2E e Lighthouse com artefatos    | Testes, Documentação       |
| Commitlint + hook de pré-commit (conventional commits garantidos)        | Arquitetura                |
| Code splitting por rota, preload por intenção, imagens responsivas       | Performance                |
| Budgets de Lighthouse versionados                                        | Performance                |
| ADRs curtos para decisões relevantes (`docs/adr`)                        | Arquitetura e documentação |
| GIF/vídeo curto dos fluxos e do cenário de tempo real no README          | Documentação               |
| Tag `v1.0.0` e changelog da entrega                                      | Documentação               |
