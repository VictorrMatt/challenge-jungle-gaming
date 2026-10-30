import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/keys'
import type { CatalogQuery } from '@/shared/contracts'

export const catalogQueryOptions = (query: CatalogQuery) =>
  queryOptions({
    queryKey: queryKeys.catalog.list(query),
    // The signal aborts superseded requests (typing, fast filter changes); responses for an
    // older key can never overwrite the current one because each key has its own cache entry.
    queryFn: ({ signal }) => api.catalog.list(query, signal),
    placeholderData: keepPreviousData,
  })

export const featuredQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.catalog.featured,
    queryFn: ({ signal }) => api.catalog.featured(signal),
    staleTime: 60_000,
  })

export const nftDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.nft.detail(id),
    queryFn: ({ signal }) => api.catalog.detail(id, signal),
    // A missing NFT is a definitive answer: never retry 404s.
    retry: (count, error) => count < 2 && 'retryable' in error && Boolean(error.retryable),
  })

export const relatedQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.nft.related(id),
    queryFn: ({ signal }) => api.catalog.related(id, signal),
    staleTime: 60_000,
  })
