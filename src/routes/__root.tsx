import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import type { RouterContext } from '@/app/router'
import { ConnectionStatus } from '@/components/feedback/connection-status'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const ScenarioPanel =
  import.meta.env.VITE_ENABLE_MOCKS !== 'false' &&
  import.meta.env.VITE_SHOW_SCENARIO_PANEL !== 'false'
    ? lazy(() => import('@/mocks/devtools/scenario-panel'))
    : null

/** Screens that show the mobile bottom tab bar (per the mobile Figma frames). */
const TAB_BAR_ROUTES = [/^\/$/, /^\/favoritos/, /^\/perfil/]

export const Route = createRootRouteWithContext<RouterContext>()({
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
      <ConnectionStatus />
      <SiteHeader />
      <main
        id="conteudo"
        tabIndex={-1}
        className={cn('outline-none', withTabBar && 'pb-28 md:pb-0')}
      >
        <Outlet />
      </main>
      <SiteFooter className={cn('hidden md:block')} />
      {withTabBar && <MobileTabBar />}
      <Toaster position="top-center" richColors={false} closeButton />
      {ScenarioPanel && (
        <Suspense fallback={null}>
          <ScenarioPanel />
        </Suspense>
      )}
    </>
  )
}
