import { delay, http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw'
import type { z } from 'zod'

import { HEADERS, type ApiErrorBody, type ApiErrorCode } from '@/shared/contracts'

import type { UserRecord } from '../db/fixtures'
import { db, mutate } from '../db/store'
import { createRandom } from '../db/fixtures'
import { activeScenario, matchFailure, nextOutOfOrderDelay } from '../scenarios/scenarios'

export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

/** Thrown inside resolvers to produce a contract-compliant error response. */
export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly extra: { fieldErrors?: Record<string, string[]>; details?: unknown }

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    extra: { fieldErrors?: Record<string, string[]>; details?: unknown } = {},
  ) {
    super(message)
    this.status = status
    this.code = code
    this.extra = extra
  }
}

let requestCounter = 0
const latencyRandom = createRandom(7)

function requestId() {
  requestCounter += 1
  return `req_${Date.now().toString(36)}_${requestCounter}`
}

const RETRYABLE = new Set<ApiErrorCode>(['SERVICE_UNAVAILABLE', 'INTERNAL_ERROR'])

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  extra: ApiError['extra'] = {},
) {
  const id = requestId()
  const body: ApiErrorBody = {
    error: { code, message, retryable: RETRYABLE.has(code), ...extra },
    requestId: id,
  }
  return HttpResponse.json(body, { status, headers: { [HEADERS.requestId]: id } })
}

function defaultCodeFor(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHENTICATED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 503) return 'SERVICE_UNAVAILABLE'
  return 'INTERNAL_ERROR'
}

async function applyLatency(path: string) {
  const scenario = activeScenario()
  if (scenario.outOfOrder?.test(path)) {
    await delay(nextOutOfOrderDelay())
    return
  }
  const { latency } = scenario
  const ms =
    typeof latency === 'number'
      ? latency
      : Math.round(latency.min + latencyRandom.next() * (latency.max - latency.min))
  if (ms > 0) await delay(ms)
}

export type AuthContext = { user: UserRecord; token: string }

export function resolveAuth(request: Request): AuthContext | null | 'expired' {
  const header = request.headers.get(HEADERS.authorization)
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  const session = db().sessions[token]
  if (!session) return 'expired'
  if (Date.now() >= Date.parse(session.expiresAt)) {
    mutate((state) => {
      delete state.sessions[token]
    })
    return 'expired'
  }
  const user = db().users[session.userId]
  return user ? { user, token } : 'expired'
}

type ResolverArgs<TBody> = {
  request: StrictRequest<DefaultBodyType>
  params: Record<string, string>
  body: TBody
  auth: AuthContext | null
  url: URL
}

type RouteOptions<TSchema extends z.ZodType | undefined> = {
  auth?: 'required' | 'optional'
  body?: TSchema
}

/**
 * Declares a REST route on the simulated backend. Every route gets, in order:
 * scenario latency → scenario failure injection → session resolution → body validation →
 * resolver, with thrown `ApiError`s mapped to the shared error envelope.
 */
export function route<TSchema extends z.ZodType | undefined = undefined>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  options: RouteOptions<TSchema>,
  resolver: (
    args: ResolverArgs<TSchema extends z.ZodType ? z.infer<TSchema> : undefined>,
  ) => Response | Promise<Response>,
) {
  return http[method](`${API_BASE}${path}`, async ({ request, params }) => {
    const url = new URL(request.url)
    const relativePath = url.pathname.slice(url.pathname.indexOf(API_BASE) + API_BASE.length)

    await applyLatency(relativePath)

    const failure = matchFailure(request.method, relativePath)
    if (failure) {
      if (failure.status === 'network-error') return HttpResponse.error()
      if (failure.status === 'timeout') {
        await delay('infinite')
      } else {
        const code = (failure.code as ApiErrorCode | undefined) ?? defaultCodeFor(failure.status)
        return errorResponse(failure.status, code, 'Falha simulada pelo cenário ativo.')
      }
    }

    try {
      const resolved = resolveAuth(request)
      if (resolved === 'expired' && options.auth) {
        throw new ApiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
      }
      const auth = resolved === 'expired' ? null : resolved
      if (options.auth === 'required' && !auth) {
        throw new ApiError(401, 'UNAUTHENTICATED', 'Entre para continuar.')
      }

      let body: unknown = undefined
      if (options.body) {
        const payload: unknown = await request.json().catch(() => undefined)
        const parsed = options.body.safeParse(payload)
        if (!parsed.success) {
          const fieldErrors: Record<string, string[]> = {}
          for (const issue of parsed.error.issues) {
            const key = issue.path.join('.') || '_root'
            ;(fieldErrors[key] ??= []).push(issue.message)
          }
          throw new ApiError(400, 'VALIDATION_ERROR', 'Revise os campos destacados.', {
            fieldErrors,
          })
        }
        body = parsed.data
      }

      const response = await resolver({
        request,
        params: params as Record<string, string>,
        body: body as TSchema extends z.ZodType ? z.infer<TSchema> : undefined,
        auth,
        url,
      })
      response.headers.set(HEADERS.requestId, requestId())
      return response
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.status, error.code, error.message, error.extra)
      }
      console.error('[mock] unhandled error', error)
      return errorResponse(500, 'INTERNAL_ERROR', 'Erro inesperado no servidor simulado.')
    }
  })
}

export function json<T>(data: T, status = 200) {
  return HttpResponse.json(data as never, { status })
}

export function noContent() {
  return new HttpResponse(null, { status: 204 })
}
