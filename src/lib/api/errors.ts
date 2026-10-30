import { isAxiosError, isCancel } from 'axios'
import type { ZodError } from 'zod'

import { apiErrorBody, type ApiErrorCode } from '@/shared/contracts'

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'canceled' | 'contract'

/**
 * Every failure that leaves the API layer is an `ApiClientError`. UI code branches on `code`
 * (business errors) or `kind` (transport errors) and never inspects Axios internals.
 */
export class ApiClientError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly code: ApiErrorCode | null
  readonly fieldErrors: Record<string, string[]>
  readonly details: unknown
  readonly retryable: boolean
  readonly requestId: string | null

  constructor(init: {
    kind: ApiErrorKind
    message: string
    status?: number | null
    code?: ApiErrorCode | null
    fieldErrors?: Record<string, string[]>
    details?: unknown
    retryable?: boolean
    requestId?: string | null
  }) {
    super(init.message)
    this.name = 'ApiClientError'
    this.kind = init.kind
    this.status = init.status ?? null
    this.code = init.code ?? null
    this.fieldErrors = init.fieldErrors ?? {}
    this.details = init.details
    this.retryable = init.retryable ?? false
    this.requestId = init.requestId ?? null
  }

  is(...codes: ApiErrorCode[]) {
    return this.code !== null && codes.includes(this.code)
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error
  if (isCancel(error)) {
    return new ApiClientError({ kind: 'canceled', message: 'Requisição cancelada.' })
  }
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiClientError({
        kind: 'timeout',
        message: 'O servidor demorou para responder. Tente novamente.',
        retryable: true,
      })
    }
    if (!error.response) {
      return new ApiClientError({
        kind: 'network',
        message: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
        retryable: true,
      })
    }
    const parsed = apiErrorBody.safeParse(error.response.data)
    if (parsed.success) {
      const { error: body, requestId } = parsed.data
      return new ApiClientError({
        kind: 'http',
        status: error.response.status,
        code: body.code,
        message: body.message,
        fieldErrors: body.fieldErrors,
        details: body.details,
        retryable: body.retryable,
        requestId,
      })
    }
    return new ApiClientError({
      kind: 'http',
      status: error.response.status,
      message: 'Resposta inesperada do servidor.',
      retryable: error.response.status >= 500,
    })
  }
  return new ApiClientError({
    kind: 'network',
    message: error instanceof Error ? error.message : 'Erro inesperado.',
  })
}

export function contractError(path: string, issues: ZodError) {
  console.error(`[api] contract violation on ${path}`, issues.issues)
  return new ApiClientError({
    kind: 'contract',
    message: 'O servidor respondeu em um formato inesperado.',
    details: issues.issues,
  })
}

/** User-facing message for any error (falls back to a generic one). */
export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.') {
  return isApiClientError(error) ? error.message : fallback
}
