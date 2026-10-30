import { delay } from 'msw'

import {
  addCartItemRequest,
  applyCouponRequest,
  connectWalletRequest,
  createOrderRequest,
  createQuoteRequest,
  endpoints,
  HEADERS,
  mergeCartRequest,
  updateCartItemRequest,
} from '@/shared/contracts'

import { db, mutate } from '../db/store'
import { activeScenario, consumeOrderTimeout } from '../scenarios/scenarios'
import {
  acknowledge,
  addItem,
  mergeGuestCart,
  presentCart,
  removeItem,
  resolveCart,
  setCoupon,
  updateItem,
} from '../services/cart'
import { listCatalog, parseCatalogQuery, relatedTo, toDetail, toSummary } from '../services/catalog'
import {
  connectWallet,
  createOrder,
  disconnectWallet,
  issueQuote,
  orderFor,
  ordersFor,
} from '../services/checkout'
import { ApiError, json, noContent, route } from './http'

/** Client-side order timeout (ms). The order-timeout scenario answers after it on purpose. */
export const ORDER_REQUEST_TIMEOUT_MS = 8000

function cartFor(request: Request, userId: string | null) {
  return resolveCart(userId, request.headers.get(HEADERS.cartId))!
}

export const commerceHandlers = [
  /* ---------------------------------------------------------------------------------- NFTs */
  route('get', endpoints.nfts.list, {}, ({ url }) =>
    json(listCatalog(parseCatalogQuery(url), { empty: activeScenario().emptyCatalog })),
  ),

  route('get', endpoints.nfts.featured, {}, () =>
    json({
      items: Object.values(db().nfts)
        .filter((nft) => nft.featured)
        .map(toSummary),
    }),
  ),

  route('get', '/nfts/:id', {}, ({ params }) => {
    const nft = db().nfts[params.id!]
    if (!nft) throw new ApiError(404, 'NOT_FOUND', 'Este NFT não existe ou foi removido.')
    return json(toDetail(nft))
  }),

  route('get', '/nfts/:id/related', {}, ({ params }) => {
    const nft = db().nfts[params.id!]
    if (!nft) throw new ApiError(404, 'NOT_FOUND', 'Este NFT não existe ou foi removido.')
    return json({ items: relatedTo(nft).slice(0, 5).map(toSummary) })
  }),

  /* ----------------------------------------------------------------------------- Favorites */
  route('get', endpoints.favorites.list, { auth: 'required' }, ({ auth }) =>
    json({ nftIds: db().favorites[auth!.user.id] ?? [] }),
  ),

  route('put', '/me/favorites/:nftId', { auth: 'required' }, ({ auth, params }) => {
    if (!db().nfts[params.nftId!]) throw new ApiError(404, 'NOT_FOUND', 'NFT inexistente.')
    const nftIds = mutate((state) => {
      const list = (state.favorites[auth!.user.id] ??= [])
      if (!list.includes(params.nftId!)) list.push(params.nftId!)
      return [...list]
    })
    return json({ nftIds })
  }),

  route('delete', '/me/favorites/:nftId', { auth: 'required' }, ({ auth, params }) => {
    const nftIds = mutate((state) => {
      state.favorites[auth!.user.id] = (state.favorites[auth!.user.id] ?? []).filter(
        (id) => id !== params.nftId,
      )
      return [...state.favorites[auth!.user.id]!]
    })
    return json({ nftIds })
  }),

  /* ---------------------------------------------------------------------------------- Cart */
  route('get', endpoints.cart.current, { auth: 'optional' }, ({ request, auth }) =>
    json(presentCart(cartFor(request, auth?.user.id ?? null))),
  ),

  route(
    'post',
    endpoints.cart.items,
    { auth: 'optional', body: addCartItemRequest },
    ({ request, auth, body }) => {
      const cart = cartFor(request, auth?.user.id ?? null)
      return json(presentCart(addItem(cart.id, body.nftId, body.editionId, body.quantity)))
    },
  ),

  route(
    'patch',
    '/cart/items/:itemId',
    { auth: 'optional', body: updateCartItemRequest },
    ({ request, auth, body, params }) => {
      const cart = cartFor(request, auth?.user.id ?? null)
      return json(presentCart(updateItem(cart.id, params.itemId!, body.quantity)))
    },
  ),

  route('delete', '/cart/items/:itemId', { auth: 'optional' }, ({ request, auth, params }) => {
    const cart = cartFor(request, auth?.user.id ?? null)
    return json(presentCart(removeItem(cart.id, params.itemId!)))
  }),

  route(
    'put',
    endpoints.cart.coupon,
    { auth: 'optional', body: applyCouponRequest },
    ({ request, auth, body }) => {
      const cart = cartFor(request, auth?.user.id ?? null)
      return json(presentCart(setCoupon(cart.id, body.code)))
    },
  ),

  route('delete', endpoints.cart.coupon, { auth: 'optional' }, ({ request, auth }) => {
    const cart = cartFor(request, auth?.user.id ?? null)
    return json(presentCart(setCoupon(cart.id, null)))
  }),

  route('post', endpoints.cart.acknowledge, { auth: 'optional' }, ({ request, auth }) => {
    const cart = cartFor(request, auth?.user.id ?? null)
    return json(presentCart(acknowledge(cart.id)))
  }),

  route(
    'post',
    endpoints.cart.merge,
    { auth: 'required', body: mergeCartRequest },
    ({ auth, body }) => json(presentCart(mergeGuestCart(auth!.user.id, body.guestCartId))),
  ),

  /* ------------------------------------------------------------------------------ Checkout */
  route(
    'post',
    endpoints.checkout.quote,
    { auth: 'required', body: createQuoteRequest },
    ({ auth, body }) => json(issueQuote(auth!.user.id, body.network)),
  ),

  route(
    'post',
    endpoints.checkout.walletSessions,
    { auth: 'required', body: connectWalletRequest },
    ({ auth, body }) => json(connectWallet(auth!.user.id, body.walletId, body.network), 201),
  ),

  route('delete', '/checkout/wallet-sessions/:id', { auth: 'required' }, ({ auth, params }) => {
    disconnectWallet(auth!.user.id, params.id!)
    return noContent()
  }),

  /* -------------------------------------------------------------------------------- Orders */
  route(
    'post',
    endpoints.orders.create,
    { auth: 'required', body: createOrderRequest },
    async ({ request, auth, body }) => {
      const key = request.headers.get(HEADERS.idempotencyKey)
      if (!key || key.length < 8) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Envie o header Idempotency-Key.')
      }
      const { order, replayed } = createOrder(auth!.user.id, key, body)
      if (!replayed && consumeOrderTimeout()) {
        // The order exists server-side, but the reply arrives after the client gave up.
        await delay(ORDER_REQUEST_TIMEOUT_MS + 4000)
      }
      return json(order, replayed ? 200 : 202)
    },
  ),

  route('get', endpoints.orders.list, { auth: 'required' }, ({ auth, url }) =>
    json({ items: ordersFor(auth!.user.id, url.searchParams.get('status')) }),
  ),

  route('get', '/orders/:id', { auth: 'required' }, ({ auth, params }) =>
    json(orderFor(auth!.user.id, params.id!)),
  ),
]
