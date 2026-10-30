import type { CatalogQuery } from '@/shared/contracts'

/**
 * Query key factory.
 *
 * Private data always lives under `['user', userId, …]`, so it is isolated per account and a
 * single `removeQueries({ queryKey: ['user'] })` wipes it on logout / user switch.
 * Public data is keyed by every parameter that changes the response.
 */
export const queryKeys = {
  catalog: {
    all: ['catalog'] as const,
    list: (query: CatalogQuery) => ['catalog', 'list', query] as const,
    featured: ['catalog', 'featured'] as const,
  },
  nft: {
    all: ['nft'] as const,
    detail: (id: string) => ['nft', id, 'detail'] as const,
    related: (id: string) => ['nft', id, 'related'] as const,
  },
  /** Visitors have a single cart per browser (its id travels in X-Cart-Id). */
  guestCart: ['guest-cart'] as const,
  user: {
    all: ['user'] as const,
    scope: (userId: string) => ['user', userId] as const,
    cart: (userId: string) => ['user', userId, 'cart'] as const,
    favorites: (userId: string) => ['user', userId, 'favorites'] as const,
    profile: (userId: string) => ['user', userId, 'profile'] as const,
    wallets: (userId: string) => ['user', userId, 'wallets'] as const,
    orders: (userId: string) => ['user', userId, 'orders'] as const,
    pendingOrders: (userId: string) => ['user', userId, 'orders', 'pending'] as const,
    order: (userId: string, orderId: string) =>
      ['user', userId, 'orders', 'detail', orderId] as const,
  },
}
