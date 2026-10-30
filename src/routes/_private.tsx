import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import {
  authModalLocation,
  getLastResolvedHref,
  isDesktopViewport,
} from '@/features/auth/auth-modal'
import { sessionStore } from '@/features/auth/session-store'

/**
 * Guard for checkout, profile, wallets, favorites and orders.
 * Visitors are sent to login with `redirect` pointing back here, so the flow resumes after auth
 * (a modal over the current page on desktop, the full-screen route on phones).
 */
export const Route = createFileRoute('/_private')({
  beforeLoad: ({ location }) => {
    if (!sessionStore.getToken()) {
      // Desktop: sign-in modal over the page the visitor came from (home on a cold start).
      if (isDesktopViewport()) {
        throw redirect(authModalLocation('entrar', location.href, getLastResolvedHref()))
      }
      throw redirect({ to: '/entrar', search: { redirect: location.href } })
    }
  },
  component: Outlet,
})
