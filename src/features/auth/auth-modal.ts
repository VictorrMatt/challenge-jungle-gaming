import { defaultParseSearch } from '@tanstack/react-router'
import { z } from 'zod'

/**
 * Desktop sign-in/sign-up is a modal over the page the collector is on (Figma "Login" /
 * "Cadastro" frames). The page stays mounted and the modal is driven by the `auth` search param,
 * while route masking keeps the familiar `/entrar?redirect=…` URL in the address bar. Reloading
 * that URL (or a guard redirect) reopens the modal over the `redirect` page when it is public,
 * over the home page otherwise. Phones keep the full-screen /entrar and /cadastro routes.
 */
export type AuthMode = 'entrar' | 'cadastro'

export const AUTH_PATHS = { entrar: '/entrar', cadastro: '/cadastro' } as const

export const DESKTOP_QUERY = '(min-width: 768px)'

/** Search params understood on every route (declared on the root route). */
export const authModalSearch = z.object({
  auth: z.enum(['entrar', 'cadastro']).optional().catch(undefined),
  redirect: z.string().max(500).optional().catch(undefined),
})

const AUTH_PATH_SET: Record<string, true> = { '/entrar': true, '/cadastro': true }

const PRIVATE_PREFIXES = ['/pagamento', '/pedido', '/perfil', '/favoritos']

export function isPrivatePath(pathname: string) {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function isDesktopViewport() {
  return typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
}

/** Last fully resolved location — the page a guard redirect should keep behind the modal. */
let lastResolvedHref: string | undefined
export function rememberResolvedHref(href: string) {
  lastResolvedHref = href
}
export function getLastResolvedHref() {
  return lastResolvedHref
}

/**
 * Navigation options that open the auth modal over `background` (any public href) with the
 * address bar showing /entrar|/cadastro?redirect=…. Usable with `navigate`, `redirect` and `<Link>`.
 */
export function authModalLocation(mode: AuthMode, redirect?: string, background?: string) {
  const url = new URL(background ?? '/', 'https://kurio.local')
  const usable = background?.startsWith('/') && !background.startsWith('//')
  const behind = usable && !isPrivatePath(url.pathname) && !(url.pathname in AUTH_PATH_SET)
  const {
    auth: _auth,
    redirect: _redirect,
    ...backgroundSearch
  } = behind ? (defaultParseSearch(url.search) as Record<string, unknown>) : {}
  return {
    to: (behind ? url.pathname : '/') as '/',
    search: { ...backgroundSearch, auth: mode, redirect } as never,
    mask: { to: AUTH_PATHS[mode], search: { redirect } } as never,
    resetScroll: false,
  }
}
