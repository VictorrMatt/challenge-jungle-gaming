import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { sessionStore } from '@/features/auth/session-store'

/**
 * Guard for checkout, profile, wallets, favorites and orders.
 * Visitors are sent to login with `redirect` pointing back here, so the flow resumes after auth.
 */
export const Route = createFileRoute('/_private')({
  beforeLoad: ({ location }) => {
    if (!sessionStore.getToken()) {
      throw redirect({ to: '/entrar', search: { redirect: location.href } })
    }
  },
  component: Outlet,
})
