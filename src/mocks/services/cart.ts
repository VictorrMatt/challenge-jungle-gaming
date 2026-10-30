import type { Cart, CartItem, CartNotice, EditionId, NetworkId } from '@/shared/contracts'
import { add, isEqual, multiply, percentage, subtract } from '@/shared/money/eth'

import { artAlt, artPath, COUPONS, NETWORK_FEES } from '../db/fixtures'
import { db, mutate, nextId, nowIso, type CartItemRecord, type CartRecord } from '../db/store'
import { ApiError } from '../handlers/http'

export function findCoupon(code: string) {
  const coupon = COUPONS.find((candidate) => candidate.code === code.trim().toUpperCase())
  if (!coupon)
    throw new ApiError(422, 'COUPON_INVALID', 'Código promocional inválido.', {
      fieldErrors: { code: ['Código promocional inválido.'] },
    })
  if (coupon.expiresAt && Date.now() > Date.parse(coupon.expiresAt)) {
    throw new ApiError(422, 'COUPON_EXPIRED', 'Este código promocional expirou.', {
      fieldErrors: { code: ['Este código promocional expirou.'] },
    })
  }
  return coupon
}

function edition(nftId: string, editionId: EditionId) {
  const nft = db().nfts[nftId]
  const found = nft?.editions.find((candidate) => candidate.id === editionId)
  return nft && found ? { nft, edition: found } : null
}

export function maxQuantityFor(nftId: string, editionId: EditionId) {
  const found = edition(nftId, editionId)
  return found ? Math.min(found.edition.available, found.edition.maxPerOrder) : 0
}

/* ------------------------------------------------------------------------------ Resolution */

export function createCart(ownerId: string | null): CartRecord {
  return mutate((state) => {
    const cart: CartRecord = {
      id: nextId('cart'),
      ownerId,
      items: [],
      couponCode: null,
      version: 1,
      updatedAt: nowIso(),
    }
    state.carts[cart.id] = cart
    if (ownerId) state.userCarts[ownerId] = cart.id
    return cart
  })
}

/** Authenticated users own one cart; visitors address theirs through `X-Cart-Id`. */
export function resolveCart(
  userId: string | null,
  guestCartId: string | null,
  { create = true } = {},
) {
  const state = db()
  if (userId) {
    const id = state.userCarts[userId]
    const cart = id ? state.carts[id] : undefined
    return cart ?? (create ? createCart(userId) : null)
  }
  const guest = guestCartId ? state.carts[guestCartId] : undefined
  if (guest && guest.ownerId === null) return guest
  return create ? createCart(null) : null
}

/* ------------------------------------------------------------------------------ Presentation */

export function presentCart(cart: CartRecord, network: NetworkId = 'ethereum'): Cart {
  const notices: CartNotice[] = []
  const items: CartItem[] = []

  for (const item of cart.items) {
    const found = edition(item.nftId, item.editionId)
    if (!found) continue
    const { nft, edition: current } = found
    const maxQuantity = Math.min(current.available, current.maxPerOrder)
    const effectiveQuantity =
      current.available === 0 ? item.quantity : Math.min(item.quantity, maxQuantity)

    if (current.available === 0) {
      notices.push({
        kind: 'SOLD_OUT',
        itemId: item.id,
        message: `${nft.name} (${current.label}) esgotou.`,
      })
    } else {
      if (!isEqual(current.price, item.acknowledgedUnitPrice)) {
        notices.push({
          kind: 'PRICE_CHANGED',
          itemId: item.id,
          message: `O preço de ${nft.name} mudou de ${item.acknowledgedUnitPrice} para ${current.price} ETH.`,
          previousPrice: item.acknowledgedUnitPrice,
          currentPrice: current.price,
        })
      }
      if (item.quantity > maxQuantity) {
        notices.push({
          kind: 'QUANTITY_REDUCED',
          itemId: item.id,
          message: `A disponibilidade de ${nft.name} (${current.label}) caiu para ${maxQuantity} ${maxQuantity === 1 ? 'unidade' : 'unidades'}.`,
        })
      }
    }

    items.push({
      id: item.id,
      nftId: nft.id,
      editionId: current.id,
      editionLabel: current.label,
      name: nft.name,
      tokenId: nft.tokenId,
      image: artPath(nft.art),
      imageAlt: artAlt(nft.art, nft.name),
      quantity: effectiveQuantity,
      unitPrice: current.price,
      acknowledgedUnitPrice: item.acknowledgedUnitPrice,
      lineTotal: multiply(current.price, effectiveQuantity),
      available: current.available,
      maxQuantity,
      nftVersion: nft.version,
    })
  }

  const purchasable = items.filter((item) => item.available > 0)
  const subtotal = add('0', ...purchasable.map((item) => item.lineTotal))
  const coupon = cart.couponCode
    ? COUPONS.find((candidate) => candidate.code === cart.couponCode)
    : undefined
  const discount = coupon ? percentage(subtotal, coupon.discountBps) : '0.00'
  const networkFee = purchasable.length > 0 ? NETWORK_FEES[network] : '0.00'

  return {
    id: cart.id,
    ownerId: cart.ownerId,
    items,
    coupon: coupon
      ? { code: coupon.code, label: coupon.label, discountBps: coupon.discountBps }
      : null,
    summary: {
      subtotal,
      discount,
      networkFee,
      total: add(subtract(subtotal, discount), networkFee),
      itemCount: purchasable.reduce((count, item) => count + item.quantity, 0),
    },
    notices,
    version: cart.version,
    updatedAt: cart.updatedAt,
  }
}

/* ------------------------------------------------------------------------------ Mutations */

function touch(cart: CartRecord) {
  cart.version += 1
  cart.updatedAt = nowIso()
}

function assertQuantity(nftId: string, editionId: EditionId, quantity: number) {
  const found = edition(nftId, editionId)
  if (!found) throw new ApiError(404, 'NOT_FOUND', 'NFT ou edição inexistente.')
  if (found.edition.available === 0) {
    throw new ApiError(409, 'EDITION_UNAVAILABLE', `A edição ${found.edition.label} está esgotada.`)
  }
  const max = Math.min(found.edition.available, found.edition.maxPerOrder)
  if (quantity > max) {
    throw new ApiError(409, 'AVAILABILITY_CONFLICT', `Quantidade máxima disponível: ${max}.`, {
      details: { maxQuantity: max },
    })
  }
  return found
}

export function addItem(cartId: string, nftId: string, editionId: EditionId, quantity: number) {
  return mutate((state) => {
    const cart = state.carts[cartId]!
    const existing = cart.items.find((item) => item.nftId === nftId && item.editionId === editionId)
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    const { edition: current } = assertQuantity(nftId, editionId, nextQuantity)
    if (existing) {
      existing.quantity = nextQuantity
      existing.acknowledgedUnitPrice = current.price
    } else {
      cart.items.push({
        id: nextId('item'),
        nftId,
        editionId,
        quantity,
        acknowledgedUnitPrice: current.price,
      })
    }
    touch(cart)
    return cart
  })
}

export function updateItem(cartId: string, itemId: string, quantity: number) {
  return mutate((state) => {
    const cart = state.carts[cartId]!
    const item = cart.items.find((candidate) => candidate.id === itemId)
    if (!item) throw new ApiError(404, 'NOT_FOUND', 'Item não está no carrinho.')
    assertQuantity(item.nftId, item.editionId, quantity)
    item.quantity = quantity
    touch(cart)
    return cart
  })
}

export function removeItem(cartId: string, itemId: string) {
  return mutate((state) => {
    const cart = state.carts[cartId]!
    const before = cart.items.length
    cart.items = cart.items.filter((item) => item.id !== itemId)
    if (cart.items.length === before)
      throw new ApiError(404, 'NOT_FOUND', 'Item não está no carrinho.')
    touch(cart)
    return cart
  })
}

export function setCoupon(cartId: string, code: string | null) {
  const coupon = code ? findCoupon(code) : null
  return mutate((state) => {
    const cart = state.carts[cartId]!
    if (coupon && cart.items.length === 0) {
      throw new ApiError(422, 'CART_EMPTY', 'Adicione itens antes de aplicar um cupom.')
    }
    cart.couponCode = coupon?.code ?? null
    touch(cart)
    return cart
  })
}

/** The collector saw the new prices: notices disappear and sold-out lines are dropped. */
export function acknowledge(cartId: string) {
  return mutate((state) => {
    const cart = state.carts[cartId]!
    cart.items = cart.items.flatMap((item): CartItemRecord[] => {
      const found = edition(item.nftId, item.editionId)
      if (!found || found.edition.available === 0) return []
      const max = Math.min(found.edition.available, found.edition.maxPerOrder)
      return [
        {
          ...item,
          quantity: Math.min(item.quantity, max),
          acknowledgedUnitPrice: found.edition.price,
        },
      ]
    })
    touch(cart)
    return cart
  })
}

/** Moves the visitor's items into the user's cart, summing quantities within availability. */
export function mergeGuestCart(userId: string, guestCartId: string) {
  const guest = db().carts[guestCartId]
  const target = resolveCart(userId, null)!
  if (!guest || guest.ownerId !== null || guest.id === target.id) return target
  return mutate((state) => {
    const cart = state.carts[target.id]!
    for (const item of guest.items) {
      const existing = cart.items.find(
        (candidate) => candidate.nftId === item.nftId && candidate.editionId === item.editionId,
      )
      const max = maxQuantityFor(item.nftId, item.editionId)
      if (max === 0) continue
      if (existing) existing.quantity = Math.min(existing.quantity + item.quantity, max)
      else cart.items.push({ ...item, id: nextId('item'), quantity: Math.min(item.quantity, max) })
    }
    cart.couponCode ??= guest.couponCode
    delete state.carts[guest.id]
    touch(cart)
    return cart
  })
}
