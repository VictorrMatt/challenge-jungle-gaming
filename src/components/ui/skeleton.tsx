import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Shimmer placeholder. Callers must give it the same box as the real content
 * (explicit size or aspect-ratio) so swapping it never shifts layout.
 *
 * The gradient is attached to the viewport, so every skeleton on screen shares a single
 * diagonal light sweep instead of each block pulsing on its own. Placed on a card surface,
 * wrap the group in `SkeletonSurface` so the placeholders keep contrast against it.
 * The animation is disabled by the global `prefers-reduced-motion` rule.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-(--shimmer-base) bg-[linear-gradient(105deg,transparent_35%,var(--shimmer-highlight)_50%,transparent_65%)] bg-size-[200%_100%] bg-fixed bg-no-repeat',
        className,
      )}
      {...props}
    />
  )
}

/** Lifts the placeholder palette one step so skeletons stay visible on `bg-card` surfaces. */
const ON_CARD_SKELETON =
  '[--shimmer-base:var(--kurio-850)] [--shimmer-highlight:color-mix(in_oklab,var(--kurio-700)_85%,var(--kurio-600))]'

/** Static card-coloured block that hosts lighter skeletons (mirrors `bg-card` containers). */
function SkeletonSurface({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div aria-hidden="true" className={cn('bg-card', ON_CARD_SKELETON, className)} {...props} />
  )
}

const LABEL_WIDTHS = ['w-24', 'w-32', 'w-20', 'w-28']

/** Form field placeholder: label line + input box, 69px tall like `FormField`. */
function FieldSkeleton({ index = 0, className }: { index?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <Skeleton className={cn('h-3.5 rounded-sm', LABEL_WIDTHS[index % LABEL_WIDTHS.length])} />
      <Skeleton className="mt-2.5 h-[45px] w-full rounded-md" />
    </div>
  )
}

export { FieldSkeleton, ON_CARD_SKELETON, Skeleton, SkeletonSurface }
