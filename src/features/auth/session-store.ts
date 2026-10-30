import { useSyncExternalStore } from 'react'

import type { Session, User } from '@/shared/contracts'

/**
 * Client session state.
 *
 * - The token is persisted in localStorage so the session survives refreshes; the server stays
 *   the authority (the session is re-validated via GET /auth/session on boot).
 * - `expired` keeps the reason a session ended so the UI can explain it and offer re-login while
 *   preserving where the collector was.
 * - Listeners are notified synchronously; React reads it through `useSyncExternalStore`.
 */

const SESSION_KEY = 'kurio:session'
const GUEST_CART_KEY = 'kurio:guest-cart-id'

export type SessionState =
  | { status: 'anonymous'; session: null; expiredFrom: string | null }
  | { status: 'authenticated'; session: Session; expiredFrom: null }

type Listener = (state: SessionState, previous: SessionState) => void

function read(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      const session = JSON.parse(raw) as Session
      if (Date.parse(session.expiresAt) > Date.now()) {
        return { status: 'authenticated', session, expiredFrom: null }
      }
      localStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // corrupted storage → anonymous
  }
  return { status: 'anonymous', session: null, expiredFrom: null }
}

let state: SessionState = read()
const listeners = new Set<Listener>()

function emit(next: SessionState) {
  const previous = state
  state = next
  for (const listener of listeners) listener(next, previous)
}

export const sessionStore = {
  getState: () => state,
  getToken: () => (state.status === 'authenticated' ? state.session.token : null),
  getUserId: () => (state.status === 'authenticated' ? state.session.user.id : null),

  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  signIn(session: Session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    emit({ status: 'authenticated', session, expiredFrom: null })
  },

  updateUser(user: User) {
    if (state.status !== 'authenticated') return
    const session = { ...state.session, user }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    emit({ status: 'authenticated', session, expiredFrom: null })
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY)
    emit({ status: 'anonymous', session: null, expiredFrom: null })
  },

  /** The server rejected the token. `from` is the location to resume after re-login. */
  expire(from: string) {
    if (state.status !== 'authenticated') return
    localStorage.removeItem(SESSION_KEY)
    emit({ status: 'anonymous', session: null, expiredFrom: from })
  },

  clearExpiredNotice() {
    if (state.status === 'anonymous' && state.expiredFrom) {
      emit({ status: 'anonymous', session: null, expiredFrom: null })
    }
  },

  getGuestCartId: () => localStorage.getItem(GUEST_CART_KEY),
  setGuestCartId: (id: string | null) =>
    id ? localStorage.setItem(GUEST_CART_KEY, id) : localStorage.removeItem(GUEST_CART_KEY),
}

/** Cross-tab sync: logging out in one tab logs out the others. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === SESSION_KEY) emit(read())
  })
}

export function useSession() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState, sessionStore.getState)
}

export function useCurrentUser(): User | null {
  const current = useSession()
  return current.status === 'authenticated' ? current.session.user : null
}
