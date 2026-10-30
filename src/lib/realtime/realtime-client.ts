import type { QueryClient } from '@tanstack/react-query'
import type { io as connectSocket, Socket } from 'socket.io-client'
import { toast } from 'sonner'

import { sessionStore } from '@/features/auth/session-store'
import { whenTransportReady } from '@/lib/api/transport'
import { queryKeys } from '@/lib/query/keys'
import {
  nftUpdatedEvent,
  orderUpdatedEvent,
  SOCKET_PATH,
  type Cart,
  type CatalogResponse,
  type FeaturedResponse,
  type NftDetail,
  type NftSummary,
  type NftUpdatedEvent,
  type Order,
  type OrderUpdatedEvent,
  type ServerToClientEvents,
} from '@/shared/contracts'

import { EventGate } from './event-gate'

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? window.location.origin

/**
 * Owns the Socket.IO connection for the current session.
 *
 * - One socket per session token: login/logout/user switch closes the previous socket and
 *   removes its listeners, so events from an old session can never touch the new user's data.
 * - Incoming events pass through the EventGate (dedupe + version ordering) and are applied to
 *   the TanStack Query cache; private resources are refetched through REST.
 * - After a reconnection, active resources are reconciled with REST (events may have been lost).
 */
export class RealtimeClient {
  private socket: Socket<ServerToClientEvents> | null = null
  private token: string | null = null
  private hasConnectedOnce = false
  private readonly gate = new EventGate()
  private readonly statusListeners = new Set<(status: ConnectionStatus) => void>()
  private status: ConnectionStatus = 'connecting'
  private unsubscribeSession: (() => void) | null = null
  private readonly queryClient: QueryClient

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  start() {
    this.connect(sessionStore.getToken())
    this.unsubscribeSession = sessionStore.subscribe(() => {
      const token = sessionStore.getToken()
      if (token !== this.token) this.connect(token)
    })
  }

  stop() {
    this.unsubscribeSession?.()
    this.attempt++
    this.teardown()
  }

  getStatus = () => this.status

  onStatus = (listener: (status: ConnectionStatus) => void) => {
    this.statusListeners.add(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  /** Lets REST responses advance the known version so older events are ignored. */
  observeVersion(type: 'nft' | 'order', id: string, version: number) {
    this.gate.observe(type, id, version)
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status
    for (const listener of this.statusListeners) listener(status)
  }

  private teardown() {
    if (!this.socket) return
    this.socket.removeAllListeners()
    this.socket.io.removeAllListeners()
    this.socket.disconnect()
    this.socket = null
  }

  private attempt = 0

  /**
   * socket.io-client is imported lazily, once the transport is ready: it is not needed for first
   * paint, and importing it only after the mock server is running guarantees it binds to the
   * MSW-patched WebSocket.
   */
  private connect(token: string | null) {
    this.teardown()
    this.gate.reset()
    this.token = token
    this.hasConnectedOnce = false
    this.setStatus('connecting')
    const attempt = ++this.attempt
    void whenTransportReady()
      .then(() => import('socket.io-client'))
      .then(({ io }) => {
        // A newer session (login/logout) superseded this connection while loading.
        if (attempt === this.attempt) this.open(io, token)
      })
  }

  private open(io: typeof connectSocket, token: string | null) {
    const socket: Socket<ServerToClientEvents> = io(SOCKET_URL, {
      path: SOCKET_PATH,
      // MSW can only intercept WebSockets; long-polling is disabled on purpose.
      transports: ['websocket'],
      query: token ? { token } : {},
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      // Fail a hanging connection attempt quickly and retry, instead of the 20 s default.
      timeout: 5000,
    })
    this.socket = socket

    socket.on('connect', () => {
      this.setStatus('connected')
      if (this.hasConnectedOnce) this.reconcile()
      this.hasConnectedOnce = true
    })
    socket.on('disconnect', () => this.setStatus(navigator.onLine ? 'reconnecting' : 'offline'))
    socket.io.on('reconnect_attempt', () => this.setStatus('reconnecting'))

    socket.on('nft.updated', (raw) => {
      const parsed = nftUpdatedEvent.safeParse(raw)
      if (parsed.success && this.gate.accept(parsed.data)) this.applyNftUpdated(parsed.data)
    })
    socket.on('order.updated', (raw) => {
      const parsed = orderUpdatedEvent.safeParse(raw)
      if (parsed.success && this.gate.accept(parsed.data)) this.applyOrderUpdated(parsed.data)
    })
  }

  /** Events may have been missed while offline: refetch whatever is on screen. */
  private reconcile() {
    void this.queryClient.invalidateQueries({
      queryKey: queryKeys.catalog.all,
      refetchType: 'active',
    })
    void this.queryClient.invalidateQueries({ queryKey: queryKeys.nft.all, refetchType: 'active' })
    void this.queryClient.invalidateQueries({ queryKey: ['guest-cart'], refetchType: 'active' })
    const userId = sessionStore.getUserId()
    if (userId) {
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.user.cart(userId) })
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.user.orders(userId) })
    }
  }

  private applyNftUpdated(event: NftUpdatedEvent) {
    const { id } = event.resource
    const { payload, version } = event
    const patchSummary = <T extends NftSummary>(nft: T): T =>
      nft.id === id && nft.version < version
        ? {
            ...nft,
            price: payload.price,
            compareAtPrice: payload.compareAtPrice,
            soldOut: payload.soldOut,
            version,
          }
        : nft

    this.queryClient.setQueryData<NftDetail>(queryKeys.nft.detail(id), (detail) =>
      detail && detail.version < version
        ? {
            ...patchSummary(detail),
            editions: detail.editions.map((edition) => {
              const next = payload.editions.find((candidate) => candidate.id === edition.id)
              return next ? { ...edition, ...next } : edition
            }),
          }
        : detail,
    )
    this.queryClient.setQueriesData<CatalogResponse | FeaturedResponse>(
      { queryKey: queryKeys.catalog.all },
      (data) => (data ? { ...data, items: data.items.map(patchSummary) } : data),
    )
    this.queryClient.setQueriesData<FeaturedResponse>({ queryKey: queryKeys.nft.all }, (data) =>
      data && 'items' in data ? { ...data, items: data.items.map(patchSummary) } : data,
    )

    // The cart summary is server-computed: refetch it and tell the collector what changed.
    const userId = sessionStore.getUserId()
    const cartKey = userId ? queryKeys.user.cart(userId) : queryKeys.guestCart
    const currentCart = this.queryClient.getQueryData<Cart>(cartKey)
    const line = currentCart?.items.find((item) => item.nftId === id)
    if (line && line.nftVersion < version) {
      void this.queryClient.invalidateQueries({ queryKey: cartKey })
      toast.warning(
        payload.soldOut
          ? `${line.name} esgotou. Revise seu carrinho.`
          : `${line.name} teve preço ou disponibilidade atualizados. O resumo foi recalculado.`,
        { id: `nft-change-${id}` },
      )
    }
  }

  private applyOrderUpdated(event: OrderUpdatedEvent) {
    const userId = sessionStore.getUserId()
    if (!userId) return
    const key = queryKeys.user.order(userId, event.resource.id)
    this.queryClient.setQueryData<Order>(key, (order) =>
      order && order.version < event.version
        ? {
            ...order,
            status: event.payload.status,
            declineReason: event.payload.declineReason,
            version: event.version,
          }
        : order,
    )
    // Full receipt + transaction data comes from REST (single source of truth).
    void this.queryClient.invalidateQueries({ queryKey: key })
    void this.queryClient.invalidateQueries({ queryKey: queryKeys.user.pendingOrders(userId) })
    if (event.payload.status === 'confirmed') {
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.user.cart(userId) })
    }
  }
}
