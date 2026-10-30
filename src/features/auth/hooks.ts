import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { api } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/keys'
import type { LoginRequest, RegisterRequest, Session } from '@/shared/contracts'

import { sessionStore } from './session-store'

/**
 * After authenticating: open the session, then move the visitor's cart into the account so
 * nothing the collector added before logging in is lost.
 */
function useCompleteSignIn() {
  const queryClient = useQueryClient()
  return async (session: Session) => {
    const guestCartId = sessionStore.getGuestCartId()
    sessionStore.signIn(session)
    if (guestCartId) {
      try {
        const merged = await api.cart.merge(guestCartId)
        queryClient.setQueryData(queryKeys.user.cart(session.user.id), merged)
      } catch {
        // Merge failure is non-blocking: the user cart is fetched normally.
      }
      sessionStore.setGuestCartId(null)
    }
    queryClient.removeQueries({ queryKey: queryKeys.guestCart })
  }
}

export function useLogin() {
  const complete = useCompleteSignIn()
  return useMutation({
    mutationFn: (body: LoginRequest) => api.auth.login(body),
    onSuccess: complete,
  })
}

export function useRegister() {
  const complete = useCompleteSignIn()
  return useMutation({
    mutationFn: (body: RegisterRequest) => api.auth.register(body),
    onSuccess: complete,
  })
}

export function useLogout() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async () => {
      // Best effort: the local session is cleared even if the server call fails.
      await api.auth.logout().catch(() => undefined)
    },
    onSettled: () => {
      sessionStore.signOut()
      toast.success('Você saiu da sua conta.')
      void navigate({ to: '/' })
    },
  })
}
