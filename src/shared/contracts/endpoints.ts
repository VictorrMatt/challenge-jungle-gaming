/** REST paths, relative to `VITE_API_BASE_URL` (default `/api`). Shared by MSW and Axios. */
export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    session: '/auth/session',
    logout: '/auth/logout',
  },
  nfts: {
    list: '/nfts',
    featured: '/nfts/featured',
    detail: (id: string) => `/nfts/${encodeURIComponent(id)}`,
    related: (id: string) => `/nfts/${encodeURIComponent(id)}/related`,
  },
  favorites: {
    list: '/me/favorites',
    item: (nftId: string) => `/me/favorites/${encodeURIComponent(nftId)}`,
  },
  cart: {
    current: '/cart',
    items: '/cart/items',
    item: (itemId: string) => `/cart/items/${encodeURIComponent(itemId)}`,
    coupon: '/cart/coupon',
    acknowledge: '/cart/acknowledge',
    merge: '/cart/merge',
  },
  checkout: {
    quote: '/checkout/quote',
    walletSessions: '/checkout/wallet-sessions',
    walletSession: (id: string) => `/checkout/wallet-sessions/${encodeURIComponent(id)}`,
  },
  orders: {
    create: '/orders',
    list: '/orders',
    detail: (id: string) => `/orders/${encodeURIComponent(id)}`,
  },
  profile: {
    current: '/me/profile',
    avatar: '/me/profile/avatar',
    password: '/me/password',
  },
  wallets: {
    list: '/me/wallets',
    slot: (slot: 'primary' | 'secondary') => `/me/wallets/${slot}`,
  },
} as const
