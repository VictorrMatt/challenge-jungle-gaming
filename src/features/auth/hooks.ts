import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { mergeGuestCart } from '@/features/cart/merge-guest-cart'
import { api } from '@/lib/api/endpoints'
import type { LoginRequest, RegisterRequest, Session } from '@/shared/contracts'

import { sessionStore } from './session-store'

/**
 * After authenticating: open the session, then move the visitor's cart into the account so
 * nothing the collector added before logging in is lost. A failed merge keeps the visitor cart
 * and is retried on the next boot.
 */
function useCompleteSignIn() {
  const queryClient = useQueryClient()
  return async (session: Session) => {
    sessionStore.signIn(session)
    const merged = await mergeGuestCart(queryClient, session.user.id)
    if (!merged) {
      toast.warning(
        'Não foi possível trazer os itens do carrinho de visitante agora. Eles foram mantidos e serão adicionados na próxima visita.',
        { id: 'guest-cart-merge' },
      )
    }
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
