import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Shimmer placeholder. Callers must give it the same box as the real content
 * (explicit size or aspect-ratio) so swapping it never shifts layout.
 * The animation is disabled by the global `prefers-reduced-motion` rule.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--shimmer-base)_0%,var(--shimmer-highlight)_50%,var(--shimmer-base)_100%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
