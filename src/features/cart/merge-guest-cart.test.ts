import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/lib/query/keys'
import type { Cart } from '@/shared/contracts'

import { mergeGuestCart } from './merge-guest-cart'

/** In-memory stand-ins: the session store persists to localStorage, the API goes through Axios. */
const guestCart = vi.hoisted(() => ({ id: null as string | null }))
const merge = vi.hoisted(() => vi.fn<(guestCartId: string) => Promise<Cart>>())

vi.mock('@/features/auth/session-store', () => ({
  sessionStore: {
    getGuestCartId: () => guestCart.id,
    setGuestCartId: (id: string | null) => {
      guestCart.id = id
    },
  },
}))
vi.mock('@/lib/api/endpoints', () => ({ api: { cart: { merge } } }))

const USER_ID = 'usr_nova'
const mergedCart = { id: 'cart_nova', ownerId: USER_ID, items: [] } as unknown as Cart

describe('mergeGuestCart', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    guestCart.id = 'cart_guest'
    merge.mockReset()
  })

  it('is a no-op without a visitor cart', async () => {
    guestCart.id = null
    await expect(mergeGuestCart(queryClient, USER_ID)).resolves.toBe(true)
    expect(merge).not.toHaveBeenCalled()
  })

  it('keeps the visitor cart id when the merge fails, so nothing is lost', async () => {
    queryClient.setQueryData(queryKeys.guestCart, { id: 'cart_guest' })
    merge.mockRejectedValueOnce(new Error('503'))

    await expect(mergeGuestCart(queryClient, USER_ID)).resolves.toBe(false)
    expect(merge).toHaveBeenCalledWith('cart_guest')
    expect(guestCart.id).toBe('cart_guest')
    expect(queryClient.getQueryData(queryKeys.user.cart(USER_ID))).toBeUndefined()
    // The visitor cart query never outlives the sign-in, even on failure.
    expect(queryClient.getQueryData(queryKeys.guestCart)).toBeUndefined()
  })

  it('a later retry (next boot) merges, fills the user cart and forgets the visitor cart', async () => {
    merge.mockRejectedValueOnce(new Error('503'))
    await mergeGuestCart(queryClient, USER_ID)

    merge.mockResolvedValueOnce(mergedCart)
    await expect(mergeGuestCart(queryClient, USER_ID)).resolves.toBe(true)
    expect(merge).toHaveBeenCalledTimes(2)
    expect(queryClient.getQueryData(queryKeys.user.cart(USER_ID))).toBe(mergedCart)
    expect(guestCart.id).toBeNull()
  })
})
