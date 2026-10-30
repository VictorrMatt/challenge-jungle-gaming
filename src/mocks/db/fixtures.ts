import type { CategoryId, Edition, EditionId, NetworkId } from '@/shared/contracts'

/**
 * Deterministic fixtures. Everything is generated from a fixed seed, so every reset restores
 * exactly the same catalog, users and coupons (required for visual regression and E2E).
 */

export const SEED = 20_260_729

/** Small deterministic PRNG (mulberry32). */
export function createRandom(seed: number) {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
  }
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  signatures: 'Assinaturas',
  utility: 'Utilidade',
}

export const NETWORK_LABELS: Record<NetworkId, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const NETWORK_FEES: Record<NetworkId, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.001',
}

export const EDITION_LABELS: Record<EditionId, string> = {
  '1-1': '1/1',
  '1-10': '1/10',
  '1-50': '1/50',
  open: 'ABERTA',
}

type Art = 'emerald-ape' | 'sage-gorilla' | 'ivory-baron' | 'golden-orangutan'

const ART_ALT: Record<Art, string> = {
  'emerald-ape': 'Macaco ilustrado com óculos redondos e jaqueta college verde',
  'sage-gorilla': 'Gorila ilustrado com chapéu bucket verde e moletom roxo',
  'ivory-baron': 'Gorila preto ilustrado com blazer creme e gola alta verde',
  'golden-orangutan': 'Orangotango ilustrado com fones de ouvido verdes e jaqueta creme',
}

export const ART_COLLECTION: Record<Art, { id: string; name: string }> = {
  'emerald-ape': { id: 'kurio-apes', name: 'Kurio Apes' },
  'sage-gorilla': { id: 'nomad-club', name: 'Nomad Club' },
  'ivory-baron': { id: 'baron-society', name: 'Baron Society' },
  'golden-orangutan': { id: 'golden-beats', name: 'Golden Beats' },
}

export type NftRecord = {
  id: string
  slug: string
  name: string
  tokenId: string
  art: Art
  category: CategoryId
  network: NetworkId
  basePrice: string
  compareAtPrice: string | null
  rarity: 'common' | 'rare' | 'legendary'
  ratingAverage: number
  ratingCount: number
  listedAt: string
  trendingScore: number
  featured: boolean
  attributes: string[]
  editions: Edition[]
  version: number
}

/** The 9 NFTs that appear in the Figma catalog, in the Figma order ("listados recentemente"). */
const FIGMA_NFTS: Array<
  Pick<NftRecord, 'name' | 'art' | 'basePrice' | 'compareAtPrice' | 'category' | 'network'> & {
    rarity?: NftRecord['rarity']
  }
> = [
  {
    name: 'Emerald Ape #042',
    art: 'emerald-ape',
    basePrice: '1.19',
    compareAtPrice: null,
    category: 'digital-art',
    network: 'ethereum',
    rarity: 'rare',
  },
  {
    name: 'Sage Nomad #009',
    art: 'sage-gorilla',
    basePrice: '1.69',
    compareAtPrice: null,
    category: 'digital-art',
    network: 'ethereum',
  },
  {
    name: 'Neon Vessel #552',
    art: 'ivory-baron',
    basePrice: '1.99',
    compareAtPrice: '2.29',
    category: 'collectibles',
    network: 'polygon',
  },
  {
    name: 'Cosmic Bloom #118',
    art: 'sage-gorilla',
    basePrice: '1.29',
    compareAtPrice: null,
    category: 'generative',
    network: 'ethereum',
  },
  {
    name: 'Violet Nomad #314',
    art: 'sage-gorilla',
    basePrice: '1.39',
    compareAtPrice: null,
    category: 'digital-art',
    network: 'polygon',
  },
  {
    name: 'Ivory Baron #088',
    art: 'ivory-baron',
    basePrice: '1.79',
    compareAtPrice: null,
    category: 'signatures',
    network: 'ethereum',
    rarity: 'rare',
  },
  {
    name: 'Golden Beat #207',
    art: 'golden-orangutan',
    basePrice: '0.99',
    compareAtPrice: null,
    category: 'music',
    network: 'solana',
  },
  {
    name: 'Golden Pulse #233',
    art: 'golden-orangutan',
    basePrice: '1.09',
    compareAtPrice: null,
    category: 'music',
    network: 'ethereum',
  },
  {
    name: 'Golden Signal #160',
    art: 'golden-orangutan',
    basePrice: '0.39',
    compareAtPrice: null,
    category: 'gaming',
    network: 'polygon',
  },
]

const NAME_PREFIXES = [
  'Amber',
  'Onyx',
  'Lunar',
  'Velvet',
  'Crimson',
  'Silent',
  'Rusty',
  'Jade',
  'Solar',
  'Midnight',
  'Copper',
  'Polar',
]
const NAME_SUFFIXES: Record<Art, readonly string[]> = {
  'emerald-ape': ['Ape', 'Primate', 'Chief'],
  'sage-gorilla': ['Nomad', 'Bloom', 'Drifter'],
  'ivory-baron': ['Baron', 'Vessel', 'Duke'],
  'golden-orangutan': ['Beat', 'Signal', 'Pulse'],
}
const ARTS: readonly Art[] = ['emerald-ape', 'sage-gorilla', 'ivory-baron', 'golden-orangutan']
const CATEGORIES = Object.keys(CATEGORY_LABELS) as CategoryId[]
const NETWORKS = Object.keys(NETWORK_LABELS) as NetworkId[]
const ATTRIBUTES: Record<Art, string[]> = {
  'emerald-ape': ['Óculos', 'Esmeralda', 'Raro'],
  'sage-gorilla': ['Chapéu bucket', 'Moletom', 'Sereno'],
  'ivory-baron': ['Blazer', 'Gola alta', 'Elegante'],
  'golden-orangutan': ['Fones', 'Dourado', 'Ritmo'],
}

export const CATALOG_SIZE = 36

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace('#', '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildEditions(
  random: ReturnType<typeof createRandom>,
  price: string,
  compareAt: string | null,
  index: number,
): Edition[] {
  const editions: Edition[] = [
    {
      id: '1-1',
      label: '1/1',
      price,
      compareAtPrice: compareAt,
      supply: 1,
      available: index % 4 === 1 ? 0 : 1,
      maxPerOrder: 1,
    },
    {
      id: '1-10',
      label: '1/10',
      price,
      compareAtPrice: compareAt,
      supply: 10,
      available: random.int(2, 10),
      maxPerOrder: 10,
    },
    {
      id: '1-50',
      label: '1/50',
      price,
      compareAtPrice: compareAt,
      supply: 50,
      available: random.int(12, 50),
      maxPerOrder: 10,
    },
    {
      id: 'open',
      label: 'ABERTA',
      price,
      compareAtPrice: compareAt,
      supply: null,
      available: 999,
      maxPerOrder: 10,
    },
  ]
  // A few NFTs are fully sold out to exercise the "esgotado" states.
  if (index === 22 || index === 31) return editions.map((edition) => ({ ...edition, available: 0 }))
  return editions
}

function uniqueName(random: ReturnType<typeof createRandom>, art: Art, used: Set<string>) {
  for (;;) {
    const candidate = `${random.pick(NAME_PREFIXES)} ${random.pick(NAME_SUFFIXES[art])} #${String(random.int(1, 999)).padStart(3, '0')}`
    if (!used.has(candidate)) return candidate
  }
}

export function buildNfts(): NftRecord[] {
  const random = createRandom(SEED)
  const baseDate = Date.parse('2026-07-29T12:00:00.000Z')
  const usedNames = new Set<string>(FIGMA_NFTS.map((nft) => nft.name))

  return Array.from({ length: CATALOG_SIZE }, (_, index) => {
    const figma = FIGMA_NFTS[index]
    const art = figma?.art ?? random.pick(ARTS)
    const name = figma?.name ?? uniqueName(random, art, usedNames)
    usedNames.add(name)
    const basePrice =
      figma?.basePrice ?? `${random.int(0, 11)}.${String(random.int(2, 99)).padStart(2, '0')}`
    const compareAtPrice = figma
      ? figma.compareAtPrice
      : index % 7 === 3
        ? `${Number.parseInt(basePrice, 10) + 1}.49`
        : null
    const numericToken = name.split('#')[1] ?? String(index)

    return {
      id: slugify(name),
      slug: slugify(name),
      name,
      tokenId: `#${numericToken.padStart(4, '0')}`,
      art,
      category: figma?.category ?? CATEGORIES[index % CATEGORIES.length]!,
      network: figma?.network ?? NETWORKS[index % NETWORKS.length]!,
      basePrice,
      compareAtPrice,
      rarity:
        figma?.rarity ?? (index % 9 === 4 ? 'rare' : index % 17 === 0 ? 'legendary' : 'common'),
      ratingAverage: Math.round((3.6 + random.next() * 1.4) * 10) / 10,
      ratingCount: random.int(3, 48),
      // Figma order first: the most recent listing is index 0.
      listedAt: new Date(baseDate - index * 36 * 60 * 60 * 1000).toISOString(),
      trendingScore: random.int(1, 100),
      featured: index < 3,
      attributes: ATTRIBUTES[art],
      editions: buildEditions(random, basePrice, compareAtPrice, index),
      version: 1,
    }
  })
}

export function artPath(art: Art) {
  return `/images/nfts/${art}`
}

export function artAlt(art: Art, name: string) {
  return `${name}: ${ART_ALT[art]}`
}

export type UserRecord = {
  id: string
  username: string
  email: string
  displayName: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
  passwordSalt: string
  /** SHA-256(salt + password), hex. Plain passwords are never stored. */
  passwordHash: string
  updatedAt: string
}

/** Fictitious credentials documented in the README. Hashes are computed at seed time. */
export const DEMO_USERS = [
  {
    id: 'usr_nova',
    username: 'nova.sato',
    email: 'nova@kurio.dev',
    displayName: 'Nova Sato',
    ensName: 'nova',
    walletNickname: 'Reserva',
    password: 'Kurio2026!',
  },
  {
    id: 'usr_theo',
    username: 'theo.lima',
    email: 'theo@kurio.dev',
    displayName: 'Theo Lima',
    ensName: 'theo',
    walletNickname: 'Principal',
    password: 'Kurio2026!',
  },
] as const

export type CouponRecord = {
  code: string
  label: string
  discountBps: number
  expiresAt: string | null
}

export const COUPONS: CouponRecord[] = [
  { code: 'KURIO10', label: 'Desconto do lançamento (10%)', discountBps: 1000, expiresAt: null },
  { code: 'GENESIS20', label: 'Genesis drop (20%)', discountBps: 2000, expiresAt: null },
  {
    code: 'VERAO2025',
    label: 'Verão 2025 (15%)',
    discountBps: 1500,
    expiresAt: '2025-03-20T00:00:00.000Z',
  },
]

export const REVIEW_AUTHORS = [
  'Ana Ribeiro',
  'Caio Mendes',
  'Lia Okada',
  'Rafael Prado',
  'Júlia Nunes',
]
export const REVIEW_COMMENTS = [
  'Arte impecável, a procedência on-chain me deu muita confiança.',
  'Os detalhes em alta resolução são incríveis. Vale cada ETH.',
  'Entrega rápida na carteira e comunidade muito ativa.',
  'Uma das melhores coleções que acompanho este ano.',
  'Adorei os atributos, combinam muito com a minha coleção.',
]
