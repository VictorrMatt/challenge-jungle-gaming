# Contratos REST e Socket.IO

Fonte de verdade em código: [`src/shared/contracts`](../src/shared/contracts). Os mesmos schemas Zod
são usados pelo servidor simulado (MSW) para validar entradas e pelo cliente Axios para validar
respostas, garantindo contratos tipados entre transporte, estado e interface.

- Base URL: `VITE_API_BASE_URL` (padrão `/api`).
- Valores em ETH são **strings decimais** (`"1.19"`); quantidades são inteiros.
- Datas em ISO 8601 com offset.
- Autenticação: `Authorization: Bearer <token>`.
- Carrinho de visitante: `X-Cart-Id: <guestCartId>`.
- Todo response carrega `X-Request-Id`.

## Envelope de erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revise os campos destacados.",
    "fieldErrors": { "email": ["Informe um e-mail válido"] },
    "details": null,
    "retryable": false
  },
  "requestId": "req_01H…"
}
```

| HTTP | `code`                                                        | Significado                                   |
| ---- | ------------------------------------------------------------- | --------------------------------------------- |
| 400  | `VALIDATION_ERROR`                                            | Payload inválido (`fieldErrors` por campo)    |
| 401  | `UNAUTHENTICATED` / `SESSION_EXPIRED` / `INVALID_CREDENTIALS` | Sem sessão, sessão expirada ou login inválido |
| 403  | `FORBIDDEN` / `WALLET_REJECTED`                               | Sem permissão / carteira recusou a conexão    |
| 404  | `NOT_FOUND`                                                   | Recurso inexistente                           |
| 409  | `EMAIL_TAKEN` / `USERNAME_TAKEN` / `CONFLICT`                 | Conflito de cadastro                          |
| 409  | `AVAILABILITY_CONFLICT` / `EDITION_UNAVAILABLE`               | Quantidade acima do disponível / esgotada     |
| 409  | `QUOTE_OUTDATED`                                              | Cotação mudou; `details.quote` traz a nova    |
| 409  | `IDEMPOTENCY_CONFLICT`                                        | Mesma chave com conteúdo diferente            |
| 422  | `COUPON_INVALID` / `COUPON_EXPIRED` / `CART_EMPTY`            | Regra de negócio                              |
| 503  | `SERVICE_UNAVAILABLE` (`retryable: true`)                     | Falha transitória                             |
| 500  | `INTERNAL_ERROR` (`retryable: true`)                          | Erro inesperado                               |

## Sessão e conta

| Método | Rota             | Corpo                                            | Resposta      |
| ------ | ---------------- | ------------------------------------------------ | ------------- |
| POST   | `/auth/register` | `{ username, email, password, confirmPassword }` | `201 Session` |
| POST   | `/auth/login`    | `{ email, password }`                            | `200 Session` |
| GET    | `/auth/session`  | —                                                | `200 Session` |
| POST   | `/auth/logout`   | —                                                | `204`         |

`Session = { token, expiresAt, user }`. Sessões expiram após `VITE_SESSION_TTL_MINUTES` (padrão 30)
ou por cenário (`session-expired`); a partir daí qualquer rota privada responde `401 SESSION_EXPIRED`.
Senhas são armazenadas no mock apenas como hash SHA-256 com salt por usuário.

## NFTs

| Método | Rota                | Query / Corpo                                                            | Resposta            |
| ------ | ------------------- | ------------------------------------------------------------------------ | ------------------- |
| GET    | `/nfts`             | `q, categories, networks, minPrice, maxPrice, tab, sort, page, pageSize` | `CatalogResponse`   |
| GET    | `/nfts/featured`    | —                                                                        | `{ items }`         |
| GET    | `/nfts/:id`         | —                                                                        | `NftDetail` / `404` |
| GET    | `/nfts/:id/related` | —                                                                        | `{ items }`         |

- `categories` e `networks` são listas separadas por vírgula e **combináveis** (AND entre grupos,
  OR dentro do grupo).
- `CatalogResponse` inclui `facets` (contagens por categoria/rede e faixa de preço) e `query`, o
  eco normalizado dos parâmetros aplicados, usado pelo cliente para descartar respostas fora de ordem.
- Cada `NftDetail` lista `editions[]` com `price`, `compareAtPrice`, `available` e `maxPerOrder`.

## Favoritos (autenticado)

| Método | Rota                   | Resposta               |
| ------ | ---------------------- | ---------------------- |
| GET    | `/me/favorites`        | `{ nftIds: string[] }` |
| PUT    | `/me/favorites/:nftId` | `{ nftIds }`           |
| DELETE | `/me/favorites/:nftId` | `{ nftIds }`           |

## Carrinho

O carrinho vive no servidor. Visitantes recebem um `cart.id` e o enviam em `X-Cart-Id`; ao autenticar,
o cliente chama `/cart/merge` e os itens do visitante são somados ao carrinho do usuário (respeitando
a disponibilidade).

| Método | Rota                | Corpo                            | Resposta |
| ------ | ------------------- | -------------------------------- | -------- |
| GET    | `/cart`             | —                                | `Cart`   |
| POST   | `/cart/items`       | `{ nftId, editionId, quantity }` | `Cart`   |
| PATCH  | `/cart/items/:id`   | `{ quantity }`                   | `Cart`   |
| DELETE | `/cart/items/:id`   | —                                | `Cart`   |
| PUT    | `/cart/coupon`      | `{ code }`                       | `Cart`   |
| DELETE | `/cart/coupon`      | —                                | `Cart`   |
| POST   | `/cart/acknowledge` | —                                | `Cart`   |
| POST   | `/cart/merge`       | `{ guestCartId }`                | `Cart`   |

`Cart.summary = { subtotal, discount, networkFee, total, itemCount }` é sempre calculado pelo servidor.
`Cart.notices[]` informa `PRICE_CHANGED`, `QUANTITY_REDUCED` e `SOLD_OUT` até o colecionador
reconhecer as mudanças (`/cart/acknowledge`).

## Checkout e pedidos (autenticado)

| Método | Rota                            | Corpo / Headers                                                                                | Resposta                                |
| ------ | ------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- |
| POST   | `/checkout/quote`               | `{ network }`                                                                                  | `Quote`                                 |
| POST   | `/checkout/wallet-sessions`     | `{ walletId, network }`                                                                        | `WalletSession` / `403 WALLET_REJECTED` |
| DELETE | `/checkout/wallet-sessions/:id` | —                                                                                              | `204`                                   |
| POST   | `/orders`                       | `Idempotency-Key` + `{ quoteId, quoteFingerprint, walletId, walletSessionId, network, buyer }` | `202 Order`                             |
| GET    | `/orders?status=pending`        | —                                                                                              | `{ items: Order[] }`                    |
| GET    | `/orders/:id`                   | —                                                                                              | `Order`                                 |

Regras de pedido:

1. A cotação (`Quote`) congela linhas, cupom, taxa e total e tem um `fingerprint`.
2. `POST /orders` **revalida** preço, disponibilidade, cupom e taxa. Se algo mudou, responde
   `409 QUOTE_OUTDATED` com a nova cotação em `details.quote`, exigindo nova confirmação.
3. **Idempotência**: a mesma `Idempotency-Key` com o mesmo corpo devolve o mesmo pedido (inclusive
   após timeout); com corpo diferente devolve `409 IDEMPOTENCY_CONFLICT`.
4. O pedido nasce `pending`. A simulação de pagamento o leva a `confirmed` ou `declined` (terminais)
   e emite `order.updated`.
5. Em `confirmed`, o servidor baixa a disponibilidade e remove do carrinho **apenas** os itens e
   quantidades comprados; em `declined` o carrinho fica intacto.
6. `Order.receipt` é um snapshot imutável: mudanças posteriores no catálogo não o alteram.

## Perfil e carteiras (autenticado)

| Método | Rota                 | Corpo                                                       | Resposta                 |
| ------ | -------------------- | ----------------------------------------------------------- | ------------------------ |
| GET    | `/me/profile`        | —                                                           | `Profile`                |
| PATCH  | `/me/profile`        | `{ displayName, username, email, ensName, walletNickname }` | `Profile`                |
| PUT    | `/me/profile/avatar` | `{ dataUrl }` (PNG/JPEG/WebP ≤ 1 MB)                        | `Profile`                |
| DELETE | `/me/profile/avatar` | —                                                           | `Profile`                |
| POST   | `/me/password`       | `{ currentPassword, newPassword, confirmPassword }`         | `204`                    |
| GET    | `/me/wallets`        | —                                                           | `{ primary, secondary }` |
| PUT    | `/me/wallets/:slot`  | `WalletInput` (`slot` = `primary` \| `secondary`)           | `Wallet`                 |

## Eventos Socket.IO

Conexão em `VITE_SOCKET_URL` com `auth: { token }` (ou sem token para visitantes). Eventos privados
(`order.updated`) só são emitidos para a sala do usuário dono da sessão.

```ts
{
  eventId: string        // identidade estável → deduplicação
  type: 'nft.updated' | 'order.updated'
  resource: { type: 'nft' | 'order', id: string }
  version: number        // versão do recurso após a mudança → descarta eventos antigos
  occurredAt: string
  payload: …
}
```

| Evento          | Payload                                                                                  | Efeito no cliente                                        |
| --------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `nft.updated`   | `{ price, compareAtPrice, soldOut, editions[{ id, price, compareAtPrice, available }] }` | Atualiza catálogo, detalhe e carrinho; anuncia a mudança |
| `order.updated` | `{ status, transactionHash, declineReason }`                                             | Atualiza o pedido; mostra confirmação ou recusa          |

Cliente → servidor: `nft.subscribe(ids)` / `nft.unsubscribe(ids)` para receber apenas os NFTs em tela.
