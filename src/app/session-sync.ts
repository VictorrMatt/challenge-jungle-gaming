import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sessionStore } from '@/features/auth/session-store'
import { bindApiClient } from '@/lib/api/client'
import { api } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/keys'

import type { router as appRouter } from './router'

/**
 * Glues the session to the transport and cache layers:
 * - injects token / guest cart id into Axios and reacts to 401 SESSION_EXPIRED;
 * - on logout, expiry or user switch, drops every private query of the previous user
 *   (the realtime client independently reconnects with the new identity);
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

    if (next.status === 'anonymous' && next.expiredFrom) {
      toast.error('Sua sessão expirou. Entre novamente para continuar de onde parou.', {
        id: 'session-expired',
      })
    }
    void router.invalidate()
  })

  // Revalidate a persisted session on boot (expired tokens trigger the 401 flow above).
  if (sessionStore.getToken()) {
    api.auth
      .session()
      .then((session) => sessionStore.updateUser(session.user))
      .catch(() => undefined)
  }
}
