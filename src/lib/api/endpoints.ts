import { z } from 'zod'

import {
  cart,
  catalogResponse,
  endpoints,
  favoritesResponse,
  featuredResponse,
  HEADERS,
  nftDetail,
  order,
  profile,
  quote,
  session,
  wallet,
  walletSession,
  walletsResponse,
  type AddCartItemRequest,
  type CatalogQuery,
  type ChangePasswordRequest,
  type ConnectWalletRequest,
  type CreateOrderRequest,
  type LoginRequest,
  type NetworkId,
  type RegisterRequest,
  type UpdateProfileRequest,
  type WalletInput,
  type WalletSlot,
} from '@/shared/contracts'

import { request, requestVoid } from './client'

/** Request timeout for order creation; after it the client retries with the same key. */
export const ORDER_TIMEOUT_MS = 8000

function catalogParams(query: CatalogQuery) {
  return {
    q: query.q || undefined,
    categories: query.categories?.length ? query.categories.join(',') : undefined,
    networks: query.networks?.length ? query.networks.join(',') : undefined,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    tab: query.tab,
    sort: query.sort,
    page: query.page,
    pageSize: query.pageSize,
  }
}

/** Typed REST client. Every function validates the response against its contract. */
export const api = {
  auth: {
    login: (body: LoginRequest) => request('post', endpoints.auth.login, session, body),
    register: (body: RegisterRequest) => request('post', endpoints.auth.register, session, body),
    session: (signal?: AbortSignal) =>
      request('get', endpoints.auth.session, session, undefined, { signal }),
    logout: () => requestVoid('post', endpoints.auth.logout),
  },

  catalog: {
    list: (query: CatalogQuery, signal?: AbortSignal) =>
      request('get', endpoints.nfts.list, catalogResponse, undefined, {
        params: catalogParams(query),
        signal,
      }),
    featured: (signal?: AbortSignal) =>
      request('get', endpoints.nfts.featured, featuredResponse, undefined, { signal }),
    detail: (id: string, signal?: AbortSignal) =>
      request('get', endpoints.nfts.detail(id), nftDetail, undefined, { signal }),
    related: (id: string, signal?: AbortSignal) =>
      request('get', endpoints.nfts.related(id), featuredResponse, undefined, { signal }),
  },

  favorites: {
    list: (signal?: AbortSignal) =>
      request('get', endpoints.favorites.list, favoritesResponse, undefined, { signal }),
    add: (nftId: string) => request('put', endpoints.favorites.item(nftId), favoritesResponse),
    remove: (nftId: string) =>
      request('delete', endpoints.favorites.item(nftId), favoritesResponse),
  },

  cart: {
    get: (signal?: AbortSignal) =>
      request('get', endpoints.cart.current, cart, undefined, { signal }),
    addItem: (body: AddCartItemRequest) => request('post', endpoints.cart.items, cart, body),
    updateItem: (itemId: string, quantity: number) =>
      request('patch', endpoints.cart.item(itemId), cart, { quantity }),
    removeItem: (itemId: string) => request('delete', endpoints.cart.item(itemId), cart),
    applyCoupon: (code: string) => request('put', endpoints.cart.coupon, cart, { code }),
    removeCoupon: () => request('delete', endpoints.cart.coupon, cart),
    acknowledge: () => request('post', endpoints.cart.acknowledge, cart),
    merge: (guestCartId: string) => request('post', endpoints.cart.merge, cart, { guestCartId }),
  },

  checkout: {
    quote: (network: NetworkId) => request('post', endpoints.checkout.quote, quote, { network }),
    connectWallet: (body: ConnectWalletRequest) =>
      request('post', endpoints.checkout.walletSessions, walletSession, body),
    disconnectWallet: (id: string) => requestVoid('delete', endpoints.checkout.walletSession(id)),
  },

  orders: {
    create: (body: CreateOrderRequest, idempotencyKey: string) =>
      request('post', endpoints.orders.create, order, body, {
        headers: { [HEADERS.idempotencyKey]: idempotencyKey },
        timeoutMs: ORDER_TIMEOUT_MS,
      }),
    pending: (signal?: AbortSignal) =>
      request('get', endpoints.orders.list, z.object({ items: z.array(order) }), undefined, {
        params: { status: 'pending' },
        signal,
      }),
    detail: (id: string, signal?: AbortSignal) =>
      request('get', endpoints.orders.detail(id), order, undefined, { signal }),
  },

  profile: {
    get: (signal?: AbortSignal) =>
      request('get', endpoints.profile.current, profile, undefined, { signal }),
    update: (body: UpdateProfileRequest) =>
      request('patch', endpoints.profile.current, profile, body),
    setAvatar: (dataUrl: string) => request('put', endpoints.profile.avatar, profile, { dataUrl }),
    removeAvatar: () => request('delete', endpoints.profile.avatar, profile),
    changePassword: (body: ChangePasswordRequest) =>
      requestVoid('post', endpoints.profile.password, body),
  },

  wallets: {
    list: (signal?: AbortSignal) =>
      request('get', endpoints.wallets.list, walletsResponse, undefined, { signal }),
    save: (slot: WalletSlot, body: WalletInput) =>
      request('put', endpoints.wallets.slot(slot), wallet, body),
  },
}
