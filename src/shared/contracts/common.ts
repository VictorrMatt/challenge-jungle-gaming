import { z } from 'zod'

import { isEthString } from '@/shared/money/eth'

/** Decimal ETH amount transported as a string ("1.19"). */
export const ethAmount = z.string().refine(isEthString, 'Invalid ETH amount')

export const isoDateTime = z.iso.datetime({ offset: true })

/**
 * Every error response uses this envelope. `code` is the machine-readable contract the UI
 * branches on; `message` is a human-readable pt-BR fallback.
 */
export const apiErrorCode = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'EMAIL_TAKEN',
  'USERNAME_TAKEN',
  'INVALID_CREDENTIALS',
  'AVAILABILITY_CONFLICT',
  'EDITION_UNAVAILABLE',
  'QUOTE_OUTDATED',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'IDEMPOTENCY_CONFLICT',
  'WALLET_REJECTED',
  'CART_EMPTY',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
])
export type ApiErrorCode = z.infer<typeof apiErrorCode>

export const apiErrorBody = z.object({
  error: z.object({
    code: apiErrorCode,
    message: z.string(),
    /** Field → messages, for VALIDATION_ERROR and conflicts tied to a form field. */
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    /** Extra machine-readable context (e.g. the fresh quote on QUOTE_OUTDATED). */
    details: z.unknown().optional(),
    /** Transient failures are safe to retry with the same request. */
    retryable: z.boolean(),
  }),
  requestId: z.string(),
})
export type ApiErrorBody = z.infer<typeof apiErrorBody>

export function paginated<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
}
export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export const HEADERS = {
  authorization: 'Authorization',
  cartId: 'X-Cart-Id',
  idempotencyKey: 'Idempotency-Key',
  requestId: 'X-Request-Id',
} as const
