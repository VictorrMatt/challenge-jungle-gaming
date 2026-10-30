import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { sessionStore, useCurrentUser } from '@/features/auth/session-store'
import { api } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/keys'
import type { AddCartItemRequest, Cart } from '@/shared/contracts'

export function useCartKey() {
  const user = useCurrentUser()
  return user ? queryKeys.user.cart(user.id) : queryKeys.guestCart
}

async function fetchCart(signal: AbortSignal) {
  const cart = await api.cart.get(signal)
  // Visitors: remember the server-issued cart id so it survives refreshes and can be merged.
  if (cart.ownerId === null && cart.id !== sessionStore.getGuestCartId()) {
    sessionStore.setGuestCartId(cart.id)
  }
  return cart
}

/** Server-owned cart (guest or user). The summary always comes from the API. */
export function useCart() {
  const key = useCartKey()
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetchCart(signal),
    staleTime: 10_000,
  })
}

export function useCartCount() {
  const { data } = useCart()
  return data?.summary.itemCount ?? 0
}

/** Every cart mutation answers with the full cart: write it straight into the cache. */
function useCartMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const key = useCartKey()
  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      queryClient.setQueryData(key, cart)
    },
    onError: () => {
      // The server state may have changed (e.g. availability): resync.
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useAddToCart() {
  return useCartMutation((body: AddCartItemRequest) => api.cart.addItem(body))
}

export function useUpdateCartItem() {
  return useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) =>
    api.cart.updateItem(itemId, quantity),
  )
}

export function useRemoveCartItem() {
  return useCartMutation((itemId: string) => api.cart.removeItem(itemId))
}

export function useApplyCoupon() {
  return useCartMutation((code: string) => api.cart.applyCoupon(code))
}

export function useRemoveCoupon() {
  return useCartMutation(() => api.cart.removeCoupon())
}

export function useAcknowledgeCart() {
  return useCartMutation(() => api.cart.acknowledge())
}
