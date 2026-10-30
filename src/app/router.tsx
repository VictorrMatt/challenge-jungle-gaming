import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

import { RouteErrorFallback } from '@/components/feedback/route-error'
import { NotFoundPage } from '@/components/feedback/not-found'
import { PageSpinner } from '@/components/feedback/page-spinner'
import { smooth } from '@/lib/motion'
import { queryClient } from '@/lib/query/client'
import { routeTree } from '@/routeTree.gen'

export type RouterContext = { queryClient: QueryClient }

export const router = createRouter({
  routeTree,
  context: { queryClient },
  // Hovering/focusing a link preloads route code + data; Query dedupes the requests.
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  // New pages start at the top instantly; only in-page anchors glide.
  scrollRestorationBehavior: 'instant',
  defaultHashScrollIntoView: { behavior: smooth(), block: 'start' },
  // Cross-fade between pages (View Transitions API). Search-only changes (filters, pagination)
  // and hash jumps keep the page in place, so they skip the transition.
  defaultViewTransition: {
    types: ({ pathChanged }) => (pathChanged && smooth() === 'smooth' ? ['page'] : false),
  },
  defaultPendingComponent: PageSpinner,
  defaultErrorComponent: RouteErrorFallback,
  defaultNotFoundComponent: () => <NotFoundPage />,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
