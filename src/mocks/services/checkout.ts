import type {
  CreateOrderRequest,
  NetworkId,
  Order,
  OrderUpdatedEvent,
  Quote,
  WalletSession,
} from '@/shared/contracts'
import { add } from '@/shared/money/eth'

import { NETWORK_FEES } from '../db/fixtures'
import { db, mutate, nextId, nowIso, type CartRecord, type OrderRecord } from '../db/store'
import { ApiError } from '../handlers/http'
import { nextEventId, publishOrderUpdated } from '../realtime/socket-server'
import { activeScenario, consumeOnce } from '../scenarios/scenarios'
import { presentCart, resolveCart } from './cart'
import { setEditionAvailability, setNftPrice } from './catalog'

const QUOTE_TTL_MS = 10 * 60_000

/** FNV-1a — enough to fingerprint quotes and request bodies deterministically. */
export function stableHash(value: unknown) {
  const text = JSON.stringify(value)
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/* ------------------------------------------------------------------------------------ Quote */

function computeQuote(
  cart: CartRecord,
  network: NetworkId,
): Omit<Quote, 'id' | 'createdAt' | 'expiresAt'> {
  const presented = presentCart(cart, network)
  const lines = presented.items
    .filter((item) => item.available > 0)
    .map((item) => ({
      itemId: item.id,
      nftId: item.nftId,
      editionId: item.editionId,
      editionLabel: item.editionLabel,
      name: item.name,
      tokenId: item.tokenId,
      image: item.image,
      imageAlt: item.imageAlt,
      quantity: Math.min(item.quantity, item.maxQuantity),
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }))
  if (lines.length === 0)
    throw new ApiError(422, 'CART_EMPTY', 'Seu carrinho não tem itens disponíveis.')

  const { subtotal, discount, networkFee, total } = presented.summary
  const fingerprint = stableHash({
    lines: lines.map(({ nftId, editionId, quantity, unitPrice }) => [
      nftId,
      editionId,
      quantity,
      unitPrice,
    ]),
    coupon: presented.coupon?.code ?? null,
    networkFee,
    total,
  })
  return {
    lines,
    coupon: presented.coupon,
    subtotal,
    discount,
    networkFee,
    total,
    network,
    fingerprint,
  }
}

export function issueQuote(userId: string, network: NetworkId): Quote {
  const cart = resolveCart(userId, null)!
  const computed = computeQuote(cart, network)
  const quote: Quote = mutate((state) => {
    const created: Quote = {
      ...computed,
      id: nextId('quote'),
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    }
    state.quotes[created.id] = { quote: created, userId, cartId: cart.id }
    return created
  })

  // Scenario hooks: the catalog changes while the collector reviews the order (once per run).
  const scenario = activeScenario()
  const first = quote.lines[0]!
  if (scenario.priceChangeOnQuote && consumeOnce('price-change')) {
    setTimeout(() => setNftPrice(first.nftId, add(first.unitPrice, '0.10')), 1200)
  }
  if (scenario.soldOutOnQuote && consumeOnce('sold-out')) {
    setTimeout(() => setEditionAvailability(first.nftId, first.editionId, 0), 1200)
  }
  return quote
}

/* ------------------------------------------------------------------------- Wallet sessions */

export function connectWallet(userId: string, walletId: string, network: NetworkId): WalletSession {
  const wallets = db().wallets[userId]
  const wallet = [wallets?.primary, wallets?.secondary].find(
    (candidate) => candidate?.id === walletId,
  )
  if (!wallet) throw new ApiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
  if (activeScenario().walletRejects) {
    throw new ApiError(403, 'WALLET_REJECTED', 'A carteira recusou a solicitação de conexão.')
  }
  return mutate((state) => {
    const session = {
      id: nextId('wsess'),
      walletId,
      network,
      status: 'connected' as const,
      connectedAt: nowIso(),
      userId,
    }
    state.walletSessions[session.id] = session
    const { userId: _owner, ...publicSession } = session
    return publicSession
  })
}

export function disconnectWallet(userId: string, sessionId: string) {
  mutate((state) => {
    const session = state.walletSessions[sessionId]
    if (session && session.userId === userId) session.status = 'disconnected'
  })
}

/* ----------------------------------------------------------------------------------- Orders */

function transactionFor(order: Order) {
  const hash = `0x${Array.from({ length: 8 }, (_, index) => stableHash([order.id, index])).join('')}`
  const explorer =
    order.receipt.network === 'polygon'
      ? 'https://polygonscan.com/tx/'
      : order.receipt.network === 'solana'
        ? 'https://solscan.io/tx/'
        : 'https://etherscan.io/tx/'
  return { hash, explorerUrl: `${explorer}${hash}` }
}

function publish(record: OrderRecord) {
  const event: OrderUpdatedEvent = {
    eventId: nextEventId(),
    type: 'order.updated',
    resource: { type: 'order', id: record.order.id },
    version: record.order.version,
    occurredAt: nowIso(),
    payload: {
      status: record.order.status,
      transactionHash: record.order.transaction?.hash ?? null,
      declineReason: record.order.declineReason,
    },
  }
  publishOrderUpdated(record.userId, event)
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function settle(orderId: string) {
  timers.delete(orderId)
  const record = db().orders[orderId]
  if (!record || record.order.status !== 'pending') return

  if (record.outcome === 'confirmed') {
    // Availability drops and ONLY the purchased quantities leave the cart.
    for (const line of record.order.receipt.lines) {
      const edition = db().nfts[line.nftId]?.editions.find(
        (candidate) => candidate.id === line.editionId,
      )
      if (edition && edition.supply !== null) {
        setEditionAvailability(line.nftId, line.editionId, edition.available - line.quantity)
      }
    }
  }

  const updated = mutate((state) => {
    const current = state.orders[orderId]!
    const now = nowIso()
    if (current.outcome === 'confirmed') {
      const cart = state.carts[current.cartId]
      if (cart) {
        cart.items = cart.items.flatMap((item) => {
          const bought = current.order.receipt.lines.find(
            (line) => line.nftId === item.nftId && line.editionId === item.editionId,
          )
          if (!bought) return [item]
          const remaining = item.quantity - bought.quantity
          return remaining > 0 ? [{ ...item, quantity: remaining }] : []
        })
        if (cart.items.length === 0) cart.couponCode = null
        cart.version += 1
        cart.updatedAt = now
      }
      const tx = transactionFor(current.order)
      current.order = {
        ...current.order,
        status: 'confirmed',
        transaction: { ...tx, confirmedAt: now },
        updatedAt: now,
        version: current.order.version + 1,
      }
    } else {
      current.order = {
        ...current.order,
        status: 'declined',
        declineReason: 'Pagamento recusado pela carteira: saldo insuficiente na rede selecionada.',
        updatedAt: now,
        version: current.order.version + 1,
      }
    }
    return current
  })
  publish(updated)
}

function schedule(record: OrderRecord) {
  if (record.order.status !== 'pending' || timers.has(record.order.id)) return
  const wait = Math.max(0, record.settlesAt - Date.now())
  timers.set(
    record.order.id,
    setTimeout(() => settle(record.order.id), wait),
  )
}

/** After a reload, pending payments resume from where they were (deterministic settle time). */
export function resumePendingOrders() {
  for (const record of Object.values(db().orders)) schedule(record)
}

export function cancelPendingTimers() {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
}

export function createOrder(userId: string, idempotencyKey: string, body: CreateOrderRequest) {
  const key = `${userId}:${idempotencyKey}`
  const requestHash = stableHash(body)
  const existingId = db().idempotency[key]
  if (existingId) {
    const existing = db().orders[existingId]!
    if (existing.requestHash !== requestHash) {
      throw new ApiError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'Esta chave de idempotência já foi usada com outro pedido.',
      )
    }
    return { order: existing.order, replayed: true }
  }

  const walletSession = db().walletSessions[body.walletSessionId]
  if (
    !walletSession ||
    walletSession.userId !== userId ||
    walletSession.walletId !== body.walletId
  ) {
    throw new ApiError(409, 'WALLET_DISCONNECTED', 'Conecte a carteira novamente para continuar.')
  }
  if (walletSession.status !== 'connected') {
    throw new ApiError(
      409,
      'WALLET_DISCONNECTED',
      'A carteira foi desconectada. Conecte-a novamente.',
    )
  }
  const wallets = db().wallets[userId]
  const wallet = [wallets?.primary, wallets?.secondary].find(
    (candidate) => candidate?.id === body.walletId,
  )
  if (!wallet) throw new ApiError(404, 'NOT_FOUND', 'Carteira não encontrada.')

  const stored = db().quotes[body.quoteId]
  if (!stored || stored.userId !== userId)
    throw new ApiError(404, 'NOT_FOUND', 'Cotação não encontrada.')

  // Revalidate price, availability, coupon and fee against the live catalog.
  const cart = db().carts[stored.cartId]
  const fresh = cart ? computeQuote(cart, body.network) : null
  const expired = Date.now() > Date.parse(stored.quote.expiresAt)
  if (
    !fresh ||
    expired ||
    fresh.fingerprint !== body.quoteFingerprint ||
    stored.quote.fingerprint !== body.quoteFingerprint
  ) {
    const replacement = fresh ? issueQuote(userId, body.network) : null
    throw new ApiError(
      409,
      'QUOTE_OUTDATED',
      'Preço, disponibilidade ou taxas mudaram. Revise e confirme novamente.',
      {
        details: { quote: replacement },
      },
    )
  }

  const scenario = activeScenario()
  const record = mutate((state) => {
    const now = nowIso()
    const order: Order = {
      id: nextId('ord'),
      status: 'pending',
      idempotencyKey,
      receipt: {
        lines: stored.quote.lines,
        coupon: stored.quote.coupon,
        subtotal: stored.quote.subtotal,
        discount: stored.quote.discount,
        networkFee: stored.quote.networkFee,
        total: stored.quote.total,
        network: body.network,
        wallet: {
          id: wallet.id,
          type: wallet.type,
          label: wallet.nickname,
          address: wallet.address,
        },
      },
      transaction: null,
      declineReason: null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    const created: OrderRecord = {
      order,
      userId,
      cartId: stored.cartId,
      requestHash,
      settlesAt: Date.now() + scenario.paymentSettleMs,
      outcome: scenario.paymentOutcome,
    }
    state.orders[order.id] = created
    state.idempotency[key] = order.id
    return created
  })

  publish(record)
  schedule(record)
  return { order: record.order, replayed: false }
}

export function ordersFor(userId: string, status?: string | null) {
  return Object.values(db().orders)
    .filter((record) => record.userId === userId && (!status || record.order.status === status))
    .map((record) => record.order)
    .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export function orderFor(userId: string, orderId: string) {
  const record = db().orders[orderId]
  // Another user's order is reported as non-existent: no data leaks across accounts.
  if (!record || record.userId !== userId)
    throw new ApiError(404, 'NOT_FOUND', 'Pedido não encontrado.')
  return record.order
}

export function networkFeeFor(network: NetworkId) {
  return NETWORK_FEES[network]
}
