import { Heart } from 'lucide-react'

import { useBump } from '@/lib/use-bump'
import { cn } from '@/lib/utils'

/** Heart icon that fills and "pops" when the favorite state flips (not on first render). */
export function FavoriteHeart({ active, className }: { active: boolean; className?: string }) {
  const bump = useBump(active)
  return (
    <Heart
      key={bump}
      className={cn(
        'transition-[fill] duration-200',
        bump > 0 && active && 'animate-pop',
        className,
      )}
      fill={active ? 'currentColor' : 'none'}
      aria-hidden="true"
    />
  )
}
