import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { isApiClientError } from '@/lib/api/errors'

/**
 * Cache policy (documented in ARCHITECTURE.md):
 * - staleTime 30 s: catalog data is also kept fresh by `nft.updated` events, so refetching on
 *   every mount is unnecessary; private data is invalidated explicitly after mutations/events.
 * - gcTime 5 min: back/forward navigation renders instantly from cache.
 * - Queries retry up to 2× with exponential backoff, but ONLY for transient failures
 *   (network, timeout, 5xx flagged `retryable`). 4xx are never retried.
 * - Mutations never retry automatically: non-idempotent operations must not be duplicated.
 *   Order creation implements its own idempotent retry (same Idempotency-Key).
 * - Aborted requests (superseded queries) are ignored by TanStack Query via AbortSignal.
 */
export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          failureCount < 2 && isApiClientError(error) && error.retryable,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const queryClient = createQueryClient()
