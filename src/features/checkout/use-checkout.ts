import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { useCurrentUser } from '@/features/auth/session-store'
import { api } from '@/lib/api/endpoints'
import { isApiClientError, type ApiClientError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/keys'
import {
  quote as quoteSchema,
  type BuyerDetails,
  type NetworkId,
  type Order,
  type Quote,
  type WalletSession,
} from '@/shared/contracts'

import {
  checkoutStorage,
  newIdempotencyKey,
  sameRequest,
  type CheckoutDraft,
} from './checkout-storage'

/** Transport failures after which the same Idempotency-Key is re-sent automatically. */
const MAX_IDEMPOTENT_RETRIES = 2

function isTransient(error: unknown): error is ApiClientError {
  return (
    isApiClientError(error) &&
    (error.kind === 'timeout' ||
      error.kind === 'network' ||
      (error.kind === 'http' && error.retryable))
  )
}

export function useOrder(orderId: string | undefined) {
  const user = useCurrentUser()
  return useQuery({
    queryKey: queryKeys.user.order(user?.id ?? 'anonymous', orderId ?? 'none'),
    queryFn: ({ signal }) => api.orders.detail(orderId!, signal),
    enabled: Boolean(user && orderId),
    // `order.updated` normally settles the order; polling is the safety net if an event is lost.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 4000 : false),
  })
}

export function usePendingOrders() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: queryKeys.user.pendingOrders(user?.id ?? 'anonymous'),
    queryFn: ({ signal }) => api.orders.pending(signal),
    enabled: Boolean(user),
  })
}

/**
 * Checkout state machine (persisted in sessionStorage):
 *   connect wallet → review (fresh quote) → confirm (idempotent order) → track until terminal.
 * A changed quote (409 QUOTE_OUTDATED) always goes back to review for a new confirmation.
 */
export function useCheckout() {
  const user = useCurrentUser()
  const userId = user?.id ?? 'anonymous'
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<CheckoutDraft>(() => checkoutStorage.read(userId))
  const [reviewQuote, setReviewQuote] = useState<Quote | null>(null)
  const [quoteChanged, setQuoteChanged] = useState(false)

  const save = useCallback(
    (patch: Partial<CheckoutDraft>) => setDraft(checkoutStorage.write(userId, patch)),
    [userId],
  )

  /* ---------------------------------------------------------------- Wallet connection */
  const connect = useMutation({
    mutationFn: ({ walletId, network }: { walletId: string; network: NetworkId }) =>
      api.checkout.connectWallet({ walletId, network }),
    onSuccess: (session: WalletSession) => save({ walletSession: session }),
  })

  const disconnect = useMutation({
    mutationFn: async () => {
      if (draft.walletSession)
        await api.checkout.disconnectWallet(draft.walletSession.id).catch(() => undefined)
    },
    onSettled: () => save({ walletSession: undefined, attempt: undefined }),
  })

  /* ------------------------------------------------------------------------- Review */
  const review = useMutation({
    mutationFn: (network: NetworkId) => api.checkout.quote(network),
    onSuccess: (quote) => {
      setQuoteChanged(false)
      setReviewQuote(quote)
    },
  })

  /* ------------------------------------------------------------------- Place order */
  const place = useMutation({
    mutationFn: async ({
      quote,
      buyer,
      network,
    }: {
      quote: Quote
      buyer: BuyerDetails
      network: NetworkId
    }) => {
      const session = draft.walletSession
      if (!session) throw new Error('wallet-not-connected')
      const body = {
        quoteId: quote.id,
        quoteFingerprint: quote.fingerprint,
        walletId: session.walletId,
        walletSessionId: session.id,
        network,
        buyer,
      }
      // Same body → reuse the persisted key (refresh/timeout recovery); new body → new key.
      const previous = checkoutStorage.read(userId).attempt
      const attempt =
        previous && sameRequest(previous.body, body) ? previous : { key: newIdempotencyKey(), body }
      save({ attempt })

      for (let retry = 0; ; retry++) {
        try {
          return await api.orders.create(attempt.body, attempt.key)
        } catch (error) {
          if (!isTransient(error) || retry >= MAX_IDEMPOTENT_RETRIES) throw error
          await new Promise((resolve) => setTimeout(resolve, 800 * (retry + 1)))
        }
      }
    },
    onSuccess: (order: Order) => {
      queryClient.setQueryData(queryKeys.user.order(userId, order.id), order)
      save({ orderId: order.id })
      setReviewQuote(null)
    },
    onError: (error) => {
      if (!isApiClientError(error)) return
      if (error.is('QUOTE_OUTDATED')) {
        // Prices/availability/fees changed: show the fresh quote and require a new confirmation.
        const fresh = quoteSchema.safeParse(
          (error.details as { quote?: unknown } | undefined)?.quote,
        )
        save({ attempt: undefined })
        setQuoteChanged(true)
        setReviewQuote(fresh.success ? fresh.data : null)
        void queryClient.invalidateQueries({ queryKey: queryKeys.user.cart(userId) })
      } else if (error.is('WALLET_DISCONNECTED')) {
        save({ walletSession: undefined, attempt: undefined })
        setReviewQuote(null)
      } else if (!isTransient(error)) {
        save({ attempt: undefined })
      }
    },
  })

  /** Re-sends the persisted attempt (same key + body) — used after refresh with no order id. */
  const recover = useMutation({
    mutationFn: async () => {
      const attempt = checkoutStorage.read(userId).attempt
      if (!attempt) return null
      return api.orders.create(attempt.body, attempt.key)
    },
    onSuccess: (order) => {
      if (order) save({ orderId: order.id })
    },
  })

  const resetAfterDecline = () => save({ orderId: undefined, attempt: undefined })
  const finish = () => {
    checkoutStorage.clear(userId)
    setDraft({})
  }

  return {
    draft,
    save,
    connect,
    disconnect,
    review,
    reviewQuote,
    quoteChanged,
    closeReview: () => setReviewQuote(null),
    place,
    recover,
    resetAfterDecline,
    finish,
  }
}
