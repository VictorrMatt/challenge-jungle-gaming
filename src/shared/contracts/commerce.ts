import { z } from 'zod'

import { walletType } from './account'
import { ethAmount, isoDateTime } from './common'
import { editionId, networkId } from './nft'

/* ---------------------------------------------------------------------------------------- Cart */

export const cartNotice = z.object({
  kind: z.enum(['PRICE_CHANGED', 'QUANTITY_REDUCED', 'SOLD_OUT']),
  itemId: z.string(),
  message: z.string(),
  previousPrice: ethAmount.optional(),
  currentPrice: ethAmount.optional(),
})
export type CartNotice = z.infer<typeof cartNotice>

export const cartItem = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId,
  editionLabel: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: z.string(),
  imageAlt: z.string(),
  quantity: z.number().int().min(1),
  /** Current catalog price — always authoritative. */
  unitPrice: ethAmount,
  /** Price the collector saw when last acknowledging the item. */
  acknowledgedUnitPrice: ethAmount,
  lineTotal: ethAmount,
  available: z.number().int().min(0),
  maxQuantity: z.number().int().min(0),
  nftVersion: z.number().int(),
})
export type CartItem = z.infer<typeof cartItem>

export const couponState = z.object({
  code: z.string(),
  label: z.string(),
  /** Discount in basis points applied over the subtotal. */
  discountBps: z.number().int(),
})
export type CouponState = z.infer<typeof couponState>

export const cartSummary = z.object({
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
  itemCount: z.number().int().min(0),
})
export type CartSummary = z.infer<typeof cartSummary>

export const cart = z.object({
  id: z.string(),
  ownerId: z.string().nullable(),
  items: z.array(cartItem),
  coupon: couponState.nullable(),
  summary: cartSummary,
  notices: z.array(cartNotice),
  version: z.number().int(),
  updatedAt: isoDateTime,
})
export type Cart = z.infer<typeof cart>

export const addCartItemRequest = z.object({
  nftId: z.string(),
  editionId,
  quantity: z.number().int().min(1),
})
export type AddCartItemRequest = z.infer<typeof addCartItemRequest>

export const updateCartItemRequest = z.object({ quantity: z.number().int().min(1) })
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequest>

export const applyCouponRequest = z.object({
  code: z.string().trim().min(1, 'Informe o código promocional').max(32),
})
export type ApplyCouponRequest = z.infer<typeof applyCouponRequest>

export const mergeCartRequest = z.object({ guestCartId: z.string() })
export type MergeCartRequest = z.infer<typeof mergeCartRequest>

/* --------------------------------------------------------------------------------------- Quote */

export const quoteLine = z.object({
  itemId: z.string(),
  nftId: z.string(),
  editionId,
  editionLabel: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: z.string(),
  imageAlt: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: ethAmount,
  lineTotal: ethAmount,
})
export type QuoteLine = z.infer<typeof quoteLine>

export const quote = z.object({
  id: z.string(),
  lines: z.array(quoteLine).min(1),
  coupon: couponState.nullable(),
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
  network: networkId,
  createdAt: isoDateTime,
  expiresAt: isoDateTime,
  /** Hash of lines + prices + coupon + fee; changes whenever anything relevant changes. */
  fingerprint: z.string(),
})
export type Quote = z.infer<typeof quote>

export const createQuoteRequest = z.object({ network: networkId })
export type CreateQuoteRequest = z.infer<typeof createQuoteRequest>

/* -------------------------------------------------------------------------------------- Orders */

export const orderStatus = z.enum(['pending', 'confirmed', 'declined'])
export type OrderStatus = z.infer<typeof orderStatus>

export const buyerDetails = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição').max(40),
  username: z.string().trim().min(3, 'Informe o nome de usuário').max(24),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil').max(40),
  email: z.email('Informe um e-mail válido'),
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{4,12}$/i, 'Use 4–12 letras ou números'),
  ensName: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,32}$/i, 'Use 3–32 letras, números ou hífen'),
  note: z.string().trim().max(280, 'Use no máximo 280 caracteres'),
})
export type BuyerDetails = z.infer<typeof buyerDetails>

export const createOrderRequest = z.object({
  quoteId: z.string(),
  quoteFingerprint: z.string(),
  walletId: z.string(),
  walletSessionId: z.string(),
  network: networkId,
  buyer: buyerDetails,
})
export type CreateOrderRequest = z.infer<typeof createOrderRequest>

/** Immutable snapshot of what was bought; never recomputed from the catalog. */
export const receipt = z.object({
  lines: z.array(quoteLine),
  coupon: couponState.nullable(),
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
  network: networkId,
  wallet: z.object({ id: z.string(), type: walletType, label: z.string(), address: z.string() }),
})
export type Receipt = z.infer<typeof receipt>

export const order = z.object({
  id: z.string(),
  status: orderStatus,
  idempotencyKey: z.string(),
  receipt,
  transaction: z
    .object({ hash: z.string(), explorerUrl: z.string(), confirmedAt: isoDateTime.nullable() })
    .nullable(),
  declineReason: z.string().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  version: z.number().int(),
})
export type Order = z.infer<typeof order>

/* ------------------------------------------------------------------------------ Wallet session */

export const walletSession = z.object({
  id: z.string(),
  walletId: z.string(),
  network: networkId,
  status: z.enum(['connected', 'disconnected']),
  connectedAt: isoDateTime,
})
export type WalletSession = z.infer<typeof walletSession>

export const connectWalletRequest = z.object({ walletId: z.string(), network: networkId })
export type ConnectWalletRequest = z.infer<typeof connectWalletRequest>
