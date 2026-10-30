import type {
  CatalogQuery,
  CatalogResponse,
  Edition,
  NftDetail,
  NftSummary,
  NftUpdatedEvent,
} from '@/shared/contracts'
import { compare, isEthString } from '@/shared/money/eth'

import {
  ART_COLLECTION,
  artAlt,
  artPath,
  CATEGORY_LABELS,
  NETWORK_LABELS,
  REVIEW_AUTHORS,
  REVIEW_COMMENTS,
  type NftRecord,
} from '../db/fixtures'
import { db, mutate, nowIso } from '../db/store'
import { nextEventId, publishNftUpdated } from '../realtime/socket-server'

export const DEFAULT_PAGE_SIZE = 9

function lowestEdition(nft: NftRecord): Edition {
  const available = nft.editions.filter((edition) => edition.available > 0)
  const pool = available.length > 0 ? available : nft.editions
  return pool.reduce((lowest, edition) =>
    compare(edition.price, lowest.price) < 0 ? edition : lowest,
  )
}

export function isSoldOut(nft: NftRecord) {
  return nft.editions.every((edition) => edition.available === 0)
}

export function toSummary(nft: NftRecord): NftSummary {
  const edition = lowestEdition(nft)
  return {
    id: nft.id,
    slug: nft.slug,
    name: nft.name,
    tokenId: nft.tokenId,
    image: artPath(nft.art),
    imageAlt: artAlt(nft.art, nft.name),
    category: nft.category,
    network: nft.network,
    collection: ART_COLLECTION[nft.art],
    price: edition.price,
    compareAtPrice: edition.compareAtPrice,
    rarity: nft.rarity,
    rating: { average: nft.ratingAverage, count: nft.ratingCount },
    soldOut: isSoldOut(nft),
    listedAt: nft.listedAt,
    version: nft.version,
  }
}

export function toDetail(nft: NftRecord): NftDetail {
  const summary = toSummary(nft)
  const collection = ART_COLLECTION[nft.art]
  const editionLabel = nft.editions.find((edition) => edition.id === '1-50')?.label ?? '1/50'
  return {
    ...summary,
    gallery: Array.from({ length: 4 }, (_, index) => ({
      src: artPath(nft.art),
      alt: index === 0 ? summary.imageAlt : `${summary.imageAlt} — vista ${index + 1}`,
    })),
    description: `Um colecionável digital finalizado à mão da coleção ${collection.name}, verificado na ${NETWORK_LABELS[nft.network]}, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${nft.name} é uma obra digital ${editionLabel} finalizada à mão da coleção ${collection.name}. Cada atributo fica armazenado nos metadados do token e verificado na ${NETWORK_LABELS[nft.network]}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    ],
    creator: { name: 'Nova Sato', royaltyBps: 500 },
    contract: { address: '0x7A42…19E8', standard: 'ERC-721' },
    attributes: nft.attributes,
    editions: nft.editions,
    reviews: Array.from({ length: Math.min(nft.ratingCount, 5) }, (_, index) => ({
      id: `${nft.id}-review-${index}`,
      author: REVIEW_AUTHORS[index % REVIEW_AUTHORS.length]!,
      rating: Math.max(3, Math.round(nft.ratingAverage - (index % 2) * 0.5)),
      comment: REVIEW_COMMENTS[index % REVIEW_COMMENTS.length]!,
    })),
  }
}

/* ------------------------------------------------------------------------------- Listing */

export function parseCatalogQuery(url: URL): CatalogQuery {
  const params = url.searchParams
  const list = (key: string) =>
    params
      .get(key)
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  const int = (key: string) => {
    const value = Number.parseInt(params.get(key) ?? '', 10)
    return Number.isFinite(value) && value > 0 ? value : undefined
  }
  const eth = (key: string) => {
    const value = params.get(key) ?? undefined
    return value && isEthString(value) ? value : undefined
  }
  return {
    q: params.get('q')?.trim() || undefined,
    categories: list('categories') as CatalogQuery['categories'],
    networks: list('networks') as CatalogQuery['networks'],
    minPrice: eth('minPrice'),
    maxPrice: eth('maxPrice'),
    tab: (params.get('tab') as CatalogQuery['tab']) ?? undefined,
    sort: (params.get('sort') as CatalogQuery['sort']) ?? undefined,
    page: int('page'),
    pageSize: int('pageSize'),
  }
}

const NEW_RELEASE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export function listCatalog(query: CatalogQuery, { empty = false } = {}): CatalogResponse {
  const all = Object.values(db().nfts)
  const newest = Math.max(...all.map((nft) => Date.parse(nft.listedAt)))
  const term = query.q?.toLowerCase()

  // Facets reflect the search term + tab only, so counts stay meaningful while filtering.
  const base = empty
    ? []
    : all.filter((nft) => {
        if (term && !`${nft.name} ${ART_COLLECTION[nft.art].name}`.toLowerCase().includes(term))
          return false
        if (query.tab === 'new' && newest - Date.parse(nft.listedAt) > NEW_RELEASE_WINDOW_MS)
          return false
        if (query.tab === 'trending' && nft.trendingScore < 60) return false
        return true
      })

  const filtered = base.filter((nft) => {
    const price = lowestEdition(nft).price
    if (query.categories?.length && !query.categories.includes(nft.category)) return false
    if (query.networks?.length && !query.networks.includes(nft.network)) return false
    if (query.minPrice && compare(price, query.minPrice) < 0) return false
    if (query.maxPrice && compare(price, query.maxPrice) > 0) return false
    return true
  })

  const sort = query.sort ?? 'recent'
  const sorted = filtered.toSorted((a, b) => {
    switch (sort) {
      case 'price-asc':
        return (
          compare(lowestEdition(a).price, lowestEdition(b).price) || a.name.localeCompare(b.name)
        )
      case 'price-desc':
        return (
          compare(lowestEdition(b).price, lowestEdition(a).price) || a.name.localeCompare(b.name)
        )
      case 'rating':
        return b.ratingAverage - a.ratingAverage || a.name.localeCompare(b.name)
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return Date.parse(b.listedAt) - Date.parse(a.listedAt)
    }
  })

  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE
  const totalPages = Math.ceil(sorted.length / pageSize)
  const page = Math.min(query.page ?? 1, Math.max(totalPages, 1))
  const prices = all.map((nft) => lowestEdition(nft).price).toSorted(compare)

  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize).map(toSummary),
    page,
    pageSize,
    total: sorted.length,
    totalPages,
    facets: {
      categories: (Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map(
        (id) => ({
          id,
          label: CATEGORY_LABELS[id],
          count: base.filter((nft) => nft.category === id).length,
        }),
      ),
      networks: (Object.keys(NETWORK_LABELS) as Array<keyof typeof NETWORK_LABELS>).map((id) => ({
        id,
        label: NETWORK_LABELS[id],
        count: base.filter((nft) => nft.network === id).length,
      })),
      priceRange: { min: prices[0] ?? '0.00', max: prices.at(-1) ?? '0.00' },
    },
    query: { ...query, page, pageSize, sort, tab: query.tab ?? 'all' },
  }
}

export function relatedTo(nft: NftRecord) {
  const all = Object.values(db().nfts).filter((other) => other.id !== nft.id)
  const sameArt = all.filter((other) => other.art !== nft.art).slice(0, 2)
  return [...all.filter((other) => other.art === nft.art), ...sameArt, ...all].filter(
    (value, index, list) => list.indexOf(value) === index,
  )
}

/* ------------------------------------------------------------------------------- Mutations */

/**
 * Applies a change to an NFT's editions, bumps its version and publishes `nft.updated`.
 * This is the ONLY way catalog data changes, so REST and events never diverge.
 */
export function updateNft(nftId: string, change: (nft: NftRecord) => void) {
  const nft = mutate((state) => {
    const record = state.nfts[nftId]
    if (!record) return null
    change(record)
    record.version += 1
    return record
  })
  if (!nft) return null

  const summary = toSummary(nft)
  const event: NftUpdatedEvent = {
    eventId: nextEventId(),
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: nowIso(),
    payload: {
      price: summary.price,
      compareAtPrice: summary.compareAtPrice,
      soldOut: summary.soldOut,
      editions: nft.editions.map(({ id, price, compareAtPrice, available }) => ({
        id,
        price,
        compareAtPrice,
        available,
      })),
    },
  }
  publishNftUpdated(event)
  return nft
}

export function setNftPrice(nftId: string, price: string) {
  return updateNft(nftId, (nft) => {
    nft.editions = nft.editions.map((edition) => ({ ...edition, price }))
  })
}

export function setEditionAvailability(nftId: string, editionId: Edition['id'], available: number) {
  return updateNft(nftId, (nft) => {
    nft.editions = nft.editions.map((edition) =>
      edition.id === editionId ? { ...edition, available: Math.max(0, available) } : edition,
    )
  })
}
