import type { QueryClient } from '@tanstack/react-query'

import { sessionStore } from '@/features/auth/session-store'
import { api } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/keys'

/**
 * Moves the visitor's cart into the signed-in account (POST /cart/merge).
 *
 * The merge is idempotent on the server (the guest cart is deleted once merged; merging an
 * unknown guest cart is a no-op), so it is safe to retry. The guest cart id is only forgotten
 * after a successful merge: if it fails, the items stay on the server and the merge runs again
 * on the next boot (see `revalidateSession`), so nothing the collector added is lost.
 *
 * Returns whether the visitor cart is now part of the account.
 */
export async function mergeGuestCart(queryClient: QueryClient, userId: string) {
  const guestCartId = sessionStore.getGuestCartId()
  if (!guestCartId) return true
  try {
    const merged = await api.cart.merge(guestCartId)
    queryClient.setQueryData(queryKeys.user.cart(userId), merged)
    sessionStore.setGuestCartId(null)
    return true
  } catch {
    return false
  } finally {
    queryClient.removeQueries({ queryKey: queryKeys.guestCart })
  }
}
