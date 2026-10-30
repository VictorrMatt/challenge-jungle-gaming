import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

/** The Figma wordmark is live text ("KURIO", Roboto Mono Bold), kept as text for crispness/a11y. */
export function Logo({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'lg' }) {
  return (
    <Link
      to="/"
      aria-label="Kurio — página inicial"
      className={cn(
        'inline-block font-bold text-foreground',
        size === 'sm'
          ? 'text-sm leading-[1.4] tracking-[1.4px]'
          : 'text-[32px] leading-none tracking-[3.2px]',
        className,
      )}
    >
      KURIO
    </Link>
  )
}
