import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sessionStore } from '@/features/auth/session-store'
import { checkoutStorage } from '@/features/checkout/checkout-storage'
import { bindApiClient } from '@/lib/api/client'
import { api } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/keys'

import type { router as appRouter } from './router'

/**
 * Glues the session to the transport and cache layers:
 * - injects token / guest cart id into Axios and reacts to 401 SESSION_EXPIRED;
 * - on logout, expiry or user switch, drops every private query of the previous user
 *   (the realtime client independently reconnects with the new identity) and, on logout or user
 *   switch, the previous user's persisted checkout draft;
 * - re-runs route guards so private screens redirect to login, keeping `redirect` to resume.
 */
export function syncSession(queryClient: QueryClient, router: typeof appRouter) {
  bindApiClient({
    getToken: sessionStore.getToken,
    getGuestCartId: sessionStore.getGuestCartId,
    onSessionExpired: () => sessionStore.expire(router.state.location.href),
  })

  sessionStore.subscribe((next, previous) => {
    const previousUser = previous.status === 'authenticated' ? previous.session.user.id : null
    const nextUser = next.status === 'authenticated' ? next.session.user.id : null
    if (previousUser === nextUser) return

    if (previousUser) queryClient.removeQueries({ queryKey: queryKeys.user.scope(previousUser) })
    if (!nextUser) queryClient.removeQueries({ queryKey: queryKeys.guestCart })

    // Checkout drafts (personal data): kept only for the collector who is signed in, or for the
    // one whose session just expired (so the checkout resumes after signing in again).
    if (nextUser) checkoutStorage.clearOthers(nextUser)
    else if (!next.expiredFrom) checkoutStorage.clearOthers(null)

    if (next.status === 'anonymous' && next.expiredFrom) {
      toast.error('Sua sessão expirou. Entre novamente para continuar de onde parou.', {
        id: 'session-expired',
      })
    }
    void router.invalidate()
  })
}

/**
 * Revalidates a persisted session against the API (expired tokens trigger the 401 flow above).
 *
 * Must run only once the app is bound to the transport (`main.tsx` calls it after evaluating the
 * app); requests themselves wait for the mock server through the transport gate.
 */
export function revalidateSession() {
  if (!sessionStore.getToken()) return
  api.auth
    .session()
    .then((session) => sessionStore.updateUser(session.user))
    .catch(() => undefined)
}
