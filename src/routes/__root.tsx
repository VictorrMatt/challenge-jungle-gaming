import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import type { RouterContext } from '@/app/router'
import { AuthModal } from '@/features/auth/components/auth-modal'
import { authModalSearch } from '@/features/auth/auth-modal'
import { ConnectionStatus } from '@/components/feedback/connection-status'
import { NavigationProgress } from '@/components/feedback/navigation-progress'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Toaster } from '@/components/ui/sonner'
import { whenTransportReady } from '@/lib/api/transport'
import { cn } from '@/lib/utils'

const ScenarioPanel =
  import.meta.env.VITE_ENABLE_MOCKS !== 'false' &&
  import.meta.env.VITE_SHOW_SCENARIO_PANEL !== 'false'
    ? // Loaded once the mock server runs, so it sees the `?panel=` flag it already recorded.
      lazy(() => whenTransportReady().then(() => import('@/mocks/devtools/scenario-panel')))
    : null

/** Screens that show the mobile bottom tab bar (per the mobile Figma frames). */
const TAB_BAR_ROUTES = [/^\/$/, /^\/favoritos/, /^\/perfil/]

export const Route = createRootRouteWithContext<RouterContext>()({
  // `auth` / `redirect` open the desktop sign-in modal over any page (see AuthModal).
  validateSearch: authModalSearch,
  component: RootLayout,
  head: () => ({
    meta: [{ title: 'Kurio — Marketplace de NFTs' }],
  }),
})

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const withTabBar = TAB_BAR_ROUTES.some((pattern) => pattern.test(pathname))

  return (
    <>
      <HeadContent />
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-sm bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <NavigationProgress />
      <ConnectionStatus />
      <SiteHeader />
      <main
        id="conteudo"
        tabIndex={-1}
        className={cn('min-h-dvh outline-none', withTabBar && 'pb-32 md:pb-0')}
      >
        <Outlet />
      </main>
      <SiteFooter className={cn('hidden md:block')} />
      {withTabBar && <MobileTabBar />}
      {/* On mobile, toasts sit below the screen top bars so they never cover back/favorite actions. */}
      <AuthModal />
      <Toaster position="top-center" richColors={false} closeButton mobileOffset={{ top: 72 }} />
      {ScenarioPanel && (
        <Suspense fallback={null}>
          <ScenarioPanel />
        </Suspense>
      )}
    </>
  )
}
