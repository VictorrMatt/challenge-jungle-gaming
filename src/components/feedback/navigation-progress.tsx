import { useIsFetching } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { queryKeys } from '@/lib/query/keys'
import { cn } from '@/lib/utils'

/** Waits this long before showing, so instant navigations never flash the bar. */
const SHOW_DELAY_MS = 120

type Phase = 'idle' | 'running' | 'finishing'

/**
 * Thin top progress bar for route loads (code chunks, guards) and catalog result changes
 * (filters, sorting, pagination). Background refreshes triggered by realtime events are
 * ignored, so the bar only ever answers something the user just did.
 */
export function NavigationProgress() {
  const routeLoading = useRouterState({ select: (state) => state.isLoading })
  const catalogLoading =
    useIsFetching({
      queryKey: [...queryKeys.catalog.all, 'list'],
      predicate: (query) => !query.state.isInvalidated,
    }) > 0
  const busy = routeLoading || catalogLoading
  const [phase, setPhase] = useState<Phase>('idle')
  const [wasBusy, setWasBusy] = useState(busy)

  // Work finished: complete the bar right away (adjusting state during render, not in an effect).
  if (busy !== wasBusy) {
    setWasBusy(busy)
    if (!busy) setPhase((current) => (current === 'running' ? 'finishing' : 'idle'))
  }

  useEffect(() => {
    const timer = busy
      ? window.setTimeout(() => setPhase('running'), SHOW_DELAY_MS)
      : window.setTimeout(() => setPhase('idle'), 450)
    return () => window.clearTimeout(timer)
  }, [busy])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden"
    >
      <div
        className={cn(
          'h-full origin-left bg-linear-to-r from-primary via-highlight to-(--kurio-coral) shadow-[0_0_10px_var(--kurio-400)]',
          phase === 'idle' && 'scale-x-0 opacity-0 transition-none',
          phase === 'running' &&
            'scale-x-[0.85] opacity-100 transition-transform duration-[6000ms] ease-[cubic-bezier(0.1,0.7,0.2,1)]',
          phase === 'finishing' &&
            'scale-x-100 opacity-0 transition-[transform,opacity] [transition-delay:0ms,150ms] duration-300 ease-out',
        )}
      />
    </div>
  )
}
