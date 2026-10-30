import { z } from 'zod'

import { ethAmount, isoDateTime, paginated } from './common'

export const categoryId = z.enum([
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'signatures',
  'utility',
])
export type CategoryId = z.infer<typeof categoryId>

export const networkId = z.enum(['ethereum', 'polygon', 'solana'])
export type NetworkId = z.infer<typeof networkId>

export const editionId = z.enum(['1-1', '1-10', '1-50', 'open'])
export type EditionId = z.infer<typeof editionId>

export const catalogTab = z.enum(['all', 'new', 'trending'])
export type CatalogTab = z.infer<typeof catalogTab>

export const catalogSort = z.enum(['recent', 'price-asc', 'price-desc', 'rating', 'name'])
export type CatalogSort = z.infer<typeof catalogSort>

export const edition = z.object({
  id: editionId,
  label: z.string(),
  price: ethAmount,
  /** Original price when the edition is on sale (rendered struck-through). */
  compareAtPrice: ethAmount.nullable(),
  supply: z.number().int().min(1).nullable(),
  available: z.number().int().min(0),
  maxPerOrder: z.number().int().min(1),
})
export type Edition = z.infer<typeof edition>

export const nftSummary = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: z.string(),
  imageAlt: z.string(),
  category: categoryId,
  network: networkId,
  collection: z.object({ id: z.string(), name: z.string() }),
  /** Lowest available edition price — what the catalog card shows. */
  price: ethAmount,
  compareAtPrice: ethAmount.nullable(),
  rarity: z.enum(['common', 'rare', 'legendary']),
  rating: z.object({ average: z.number().min(0).max(5), count: z.number().int().min(0) }),
  soldOut: z.boolean(),
  listedAt: isoDateTime,
  /** Monotonic resource version used to order realtime updates. */
  version: z.number().int().min(1),
})
export type NftSummary = z.infer<typeof nftSummary>

export const nftDetail = nftSummary.extend({
  gallery: z.array(z.object({ src: z.string(), alt: z.string() })).min(1),
  description: z.string(),
  story: z.array(z.string()),
  creator: z.object({ name: z.string(), royaltyBps: z.number().int() }),
  contract: z.object({ address: z.string(), standard: z.string() }),
  attributes: z.array(z.string()),
  editions: z.array(edition).min(1),
  reviews: z.array(
    z.object({ id: z.string(), author: z.string(), rating: z.number(), comment: z.string() }),
  ),
})
export type NftDetail = z.infer<typeof nftDetail>

export const catalogQuery = z.object({
  q: z.string().trim().max(80).optional(),
  categories: z.array(categoryId).optional(),
  networks: z.array(networkId).optional(),
  minPrice: ethAmount.optional(),
  maxPrice: ethAmount.optional(),
  tab: catalogTab.optional(),
  sort: catalogSort.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(48).optional(),
})
export type CatalogQuery = z.infer<typeof catalogQuery>

export const catalogFacets = z.object({
  categories: z.array(z.object({ id: categoryId, label: z.string(), count: z.number().int() })),
  networks: z.array(z.object({ id: networkId, label: z.string(), count: z.number().int() })),
  priceRange: z.object({ min: ethAmount, max: ethAmount }),
})
export type CatalogFacets = z.infer<typeof catalogFacets>

export const catalogResponse = paginated(nftSummary).extend({
  facets: catalogFacets,
  /** Echo of the normalized query the server applied (lets the client discard stale replies). */
  query: catalogQuery,
})
export type CatalogResponse = z.infer<typeof catalogResponse>

export const featuredResponse = z.object({ items: z.array(nftSummary) })
export type FeaturedResponse = z.infer<typeof featuredResponse>
