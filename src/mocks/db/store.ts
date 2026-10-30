import type { EditionId, NetworkId, Order, Quote, Wallet, WalletSession } from '@/shared/contracts'

import { buildNfts, DEMO_USERS, type NftRecord, type UserRecord } from './fixtures'

/**
 * In-memory database of the simulated backend.
 *
 * - Lives only inside the mock layer (MSW handlers + Socket.IO mock); the app never touches it.
 * - Persisted to localStorage after every mutation so refreshes keep carts, orders, profile, etc.
 * - `resetDatabase()` restores the deterministic seed (same data on every reset).
 */

export type CartItemRecord = {
  id: string
  nftId: string
  editionId: EditionId
  quantity: number
  acknowledgedUnitPrice: string
}

export type CartRecord = {
  id: string
  ownerId: string | null
  items: CartItemRecord[]
  couponCode: string | null
  version: number
  updatedAt: string
}

export type SessionRecord = { token: string; userId: string; expiresAt: string }

export type QuoteRecord = { quote: Quote; userId: string; cartId: string }

export type OrderRecord = {
  order: Order
  userId: string
  cartId: string
  /** Stable hash of the request body, used to detect idempotency-key reuse with other content. */
  requestHash: string
  /** Epoch ms when the simulated payment settles. */
  settlesAt: number
  outcome: 'confirmed' | 'declined'
}

export type WalletSessionRecord = WalletSession & { userId: string }

export type Database = {
  schemaVersion: number
  nfts: Record<string, NftRecord>
  users: Record<string, UserRecord>
  sessions: Record<string, SessionRecord>
  favorites: Record<string, string[]>
  carts: Record<string, CartRecord>
  userCarts: Record<string, string>
  wallets: Record<string, { primary: Wallet | null; secondary: Wallet | null }>
  quotes: Record<string, QuoteRecord>
  walletSessions: Record<string, WalletSessionRecord>
  orders: Record<string, OrderRecord>
  idempotency: Record<string, string>
  sequence: number
}

const STORAGE_KEY = 'kurio:mock-db'
const SCHEMA_VERSION = 1

export async function hashPassword(password: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const SEED_TIME = '2026-07-29T12:00:00.000Z'

function seedWallets(): Database['wallets'] {
  const base = {
    referralCode: 'KURIO26',
    updatedAt: SEED_TIME,
  }
  return {
    usr_nova: {
      primary: {
        ...base,
        id: 'wal_nova_primary',
        slot: 'primary',
        displayName: 'Nova Sato',
        nickname: 'Principal',
        network: 'ethereum',
        profileName: 'nova.sato',
        address: '0xA91F3c5D8e2B7a4F6c1D9e8B3a7C5d2E4f6aE82C',
        secondaryAddress: '',
        type: 'metamask',
        email: 'nova@kurio.dev',
        ensName: 'nova',
      },
      secondary: {
        ...base,
        id: 'wal_nova_secondary',
        slot: 'secondary',
        displayName: 'Nova Sato',
        nickname: 'Reserva',
        network: 'polygon',
        profileName: 'nova.kurio',
        address: '0x5B2e8C1a9D4f7E3b6A0c2D8e1F9a4B7c3D6e8F01',
        secondaryAddress: '',
        type: 'coinbase',
        email: 'nova@kurio.dev',
        ensName: 'nova-kurio',
      },
    },
    usr_theo: {
      primary: {
        ...base,
        id: 'wal_theo_primary',
        slot: 'primary',
        displayName: 'Theo Lima',
        nickname: 'Principal',
        network: 'ethereum',
        profileName: 'theo.lima',
        address: '0x3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d',
        secondaryAddress: '',
        type: 'walletconnect',
        email: 'theo@kurio.dev',
        ensName: 'theo',
      },
      secondary: null,
    },
  }
}

export async function createSeed(): Promise<Database> {
  const users: Database['users'] = {}
  for (const demo of DEMO_USERS) {
    const passwordSalt = `salt-${demo.id}`
    users[demo.id] = {
      id: demo.id,
      username: demo.username,
      email: demo.email,
      displayName: demo.displayName,
      ensName: demo.ensName,
      walletNickname: demo.walletNickname,
      avatarUrl: null,
      passwordSalt,
      passwordHash: await hashPassword(demo.password, passwordSalt),
      updatedAt: SEED_TIME,
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    nfts: Object.fromEntries(buildNfts().map((nft) => [nft.id, nft])),
    users,
    sessions: {},
    favorites: { usr_nova: ['emerald-ape-042'], usr_theo: [] },
    carts: {},
    userCarts: {},
    wallets: seedWallets(),
    quotes: {},
    walletSessions: {},
    orders: {},
    idempotency: {},
    sequence: 0,
  }
}

let database: Database | null = null

function readPersisted(): Database | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Database
    return parsed.schemaVersion === SCHEMA_VERSION ? parsed : null
  } catch {
    return null
  }
}

export function persist() {
  if (!database) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database))
  } catch {
    // Storage may be full or unavailable (private mode); the session keeps working in memory.
  }
}

export async function initDatabase() {
  database = readPersisted() ?? (await createSeed())
  persist()
  return database
}

export async function resetDatabase() {
  database = await createSeed()
  persist()
  return database
}

export function db(): Database {
  if (!database) throw new Error('Mock database used before initDatabase()')
  return database
}

/** Runs a mutation and persists the result atomically. */
export function mutate<T>(fn: (state: Database) => T): T {
  const result = fn(db())
  persist()
  return result
}

/** Deterministic, monotonic ids: stable across runs for the same sequence of operations. */
export function nextId(prefix: string) {
  const state = db()
  state.sequence += 1
  return `${prefix}_${state.sequence.toString(36).padStart(6, '0')}`
}

export function nowIso() {
  return new Date().toISOString()
}

export function networkLabel(network: NetworkId) {
  return network === 'ethereum' ? 'Ethereum' : network === 'polygon' ? 'Polygon' : 'Solana'
}
