import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'

import { HEADERS } from '@/shared/contracts'

import { ApiClientError, contractError, toApiClientError } from './errors'
import { whenTransportReady } from './transport'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/**
 * Hooks the API layer needs from the session layer. Injected at startup to avoid a
 * dependency cycle (session code itself calls the API).
 */
type ClientBindings = {
  getToken: () => string | null
  getGuestCartId: () => string | null
  onSessionExpired: () => void
}

let bindings: ClientBindings = {
  getToken: () => null,
  getGuestCartId: () => null,
  onSessionExpired: () => {},
}

export function bindApiClient(next: ClientBindings) {
  bindings = next
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use(async (config) => {
  await whenTransportReady()
  const token = bindings.getToken()
  if (token) {
    config.headers.set(HEADERS.authorization, `Bearer ${token}`)
  } else {
    const guestCartId = bindings.getGuestCartId()
    if (guestCartId) config.headers.set(HEADERS.cartId, guestCartId)
  }
  return config
})

http.interceptors.response.use(undefined, (error: unknown) => {
  const normalized = toApiClientError(error)
  // Only react to expiry of the session that is still current (not to a stale request).
  if (normalized.is('SESSION_EXPIRED') && bindings.getToken()) bindings.onSessionExpired()
  return Promise.reject(normalized)
})

type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'signal'> & {
  signal?: AbortSignal
  /** Client-side timeout implemented with timers (controllable by Playwright's clock). */
  timeoutMs?: number
}

/**
 * Performs a request and validates the response body against its contract schema.
 * Callers receive fully typed data or an `ApiClientError` — never raw Axios objects.
 */
export async function request<TSchema extends z.ZodType>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  schema: TSchema,
  data?: unknown,
  { timeoutMs, signal, ...config }: RequestOptions = {},
): Promise<z.infer<TSchema>> {
  const controller = new AbortController()
  const abortFromParent = () => controller.abort(signal?.reason)
  if (signal?.aborted) controller.abort(signal.reason)
  signal?.addEventListener('abort', abortFromParent, { once: true })
  let timedOut = false
  const timer =
    timeoutMs === undefined
      ? undefined
      : setTimeout(() => {
          timedOut = true
          controller.abort()
        }, timeoutMs)

  try {
    const response = await http.request({ method, url, data, signal: controller.signal, ...config })
    const parsed = schema.safeParse(response.data)
    if (!parsed.success) throw contractError(url, parsed.error)
    return parsed.data
  } catch (error) {
    const normalized = toApiClientError(error)
    if (timedOut && normalized.kind === 'canceled') {
      throw new ApiClientError({
        kind: 'timeout',
        message: 'O servidor demorou para responder. Tente novamente.',
        retryable: true,
      })
    }
    throw normalized
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abortFromParent)
  }
}

/** For endpoints that answer 204 No Content. */
export async function requestVoid(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  config: RequestOptions = {},
) {
  try {
    await http.request({ method, url, data, ...config })
  } catch (error) {
    throw toApiClientError(error)
  }
}
