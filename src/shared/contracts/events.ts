import { z } from 'zod'

import { ethAmount, isoDateTime } from './common'
import { orderStatus } from './commerce'
import { editionId } from './nft'

/**
 * Socket.IO event envelope. Every event carries:
 * - `eventId`: stable identity, used to drop duplicates;
 * - `resource`: the affected entity;
 * - `version`: the resource version after the change, used to drop stale events.
 */
function envelope<TType extends string, TResource extends string, TPayload extends z.ZodType>(
  type: TType,
  resourceType: TResource,
  payload: TPayload,
) {
  return z.object({
    eventId: z.string(),
    type: z.literal(type),
    resource: z.object({ type: z.literal(resourceType), id: z.string() }),
    version: z.number().int().min(1),
    occurredAt: isoDateTime,
    payload,
  })
}

export const nftUpdatedEvent = envelope(
  'nft.updated',
  'nft',
  z.object({
    price: ethAmount,
    compareAtPrice: ethAmount.nullable(),
    soldOut: z.boolean(),
    editions: z.array(
      z.object({
        id: editionId,
        price: ethAmount,
        compareAtPrice: ethAmount.nullable(),
        available: z.number().int().min(0),
      }),
    ),
  }),
)
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEvent>

export const orderUpdatedEvent = envelope(
  'order.updated',
  'order',
  z.object({
    status: orderStatus,
    transactionHash: z.string().nullable(),
    declineReason: z.string().nullable(),
  }),
)
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEvent>

export const SOCKET_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const

export type ServerToClientEvents = {
  'nft.updated': (event: NftUpdatedEvent) => void
  'order.updated': (event: OrderUpdatedEvent) => void
}

/** Client → server: subscribe to the NFT rooms currently on screen. */
export type ClientToServerEvents = {
  'nft.subscribe': (nftIds: string[]) => void
  'nft.unsubscribe': (nftIds: string[]) => void
}
