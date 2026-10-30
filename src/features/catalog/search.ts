import { z } from 'zod'

import {
  catalogSort,
  catalogTab,
  categoryId,
  ethAmount,
  networkId,
  type CatalogQuery,
} from '@/shared/contracts'

export const CATALOG_PAGE_SIZE = 9

/**
 * Catalog URL state. Search, filters, sort and page live in the URL so they survive refresh,
 * can be shared and are restored by back/forward navigation. Invalid values are dropped
 * (`.catch`) instead of breaking the page.
 */
export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  categories: z.array(categoryId).optional().catch(undefined),
  networks: z.array(networkId).optional().catch(undefined),
  minPrice: ethAmount.optional().catch(undefined),
  maxPrice: ethAmount.optional().catch(undefined),
  tab: catalogTab.optional().catch(undefined),
  sort: catalogSort.optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
})
export type CatalogSearch = z.infer<typeof catalogSearchSchema>

/** Normalized API query: stable key order and defaults, so equivalent URLs share a cache entry. */
export function toCatalogQuery(search: CatalogSearch): CatalogQuery {
  return {
    q: search.q || undefined,
    categories: search.categories?.length ? [...search.categories].sort() : undefined,
    networks: search.networks?.length ? [...search.networks].sort() : undefined,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    tab: search.tab ?? 'all',
    sort: search.sort ?? 'recent',
    page: search.page ?? 1,
    pageSize: CATALOG_PAGE_SIZE,
  }
}

export function hasActiveFilters(search: CatalogSearch) {
  return Boolean(
    search.q ||
    search.categories?.length ||
    search.networks?.length ||
    search.minPrice ||
    search.maxPrice,
  )
}

export const SORT_LABELS: Record<NonNullable<CatalogSearch['sort']>, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  rating: 'Mais bem avaliados',
  name: 'Nome (A–Z)',
}

export const TAB_LABELS: Record<NonNullable<CatalogSearch['tab']>, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}
