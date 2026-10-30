import type { CreateOrderRequest, NetworkId, WalletSession } from '@/shared/contracts'

/**
 * Checkout context persisted per user in sessionStorage. It survives refreshes, session expiry
 * (re-login resumes the flow) and connection drops, which is what makes order recovery possible:
 *
 * - `attempt`: the idempotency key + exact request body of the order being placed. Re-sending
 *   the same pair after a timeout/refresh can only return the same order, never a second one.
 * - `orderId`: once known, the page tracks that order until it is confirmed or declined.
 */
export type CheckoutDraft = {
  form?: Record<string, unknown>
  walletId?: string
  network?: NetworkId
  walletSession?: WalletSession
  attempt?: { key: string; body: CreateOrderRequest }
  orderId?: string
}

const key = (userId: string) => `kurio:checkout:${userId}`

export const checkoutStorage = {
  read(userId: string): CheckoutDraft {
    try {
      return JSON.parse(sessionStorage.getItem(key(userId)) ?? '{}') as CheckoutDraft
    } catch {
      return {}
    }
  },
  write(userId: string, patch: Partial<CheckoutDraft>) {
    const next = { ...checkoutStorage.read(userId), ...patch }
    for (const [field, value] of Object.entries(next)) {
      if (value === undefined) delete next[field as keyof CheckoutDraft]
    }
    sessionStorage.setItem(key(userId), JSON.stringify(next))
    return next
  },
  clear(userId: string) {
    sessionStorage.removeItem(key(userId))
  },
}

export function newIdempotencyKey() {
  return `chk_${crypto.randomUUID()}`
}

export function sameRequest(a: CreateOrderRequest, b: CreateOrderRequest) {
  return JSON.stringify(a) === JSON.stringify(b)
}
