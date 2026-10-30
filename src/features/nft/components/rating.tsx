import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

export function RatingStars({
  average,
  count,
  className,
}: {
  average: number
  count: number
  className?: string
}) {
  const rounded = Math.round(average)
  return (
    <p className={cn('flex items-center gap-1 text-base text-foreground', className)}>
      <span className="flex gap-0.5 text-highlight" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className="size-[15px]"
            fill={index < rounded ? 'currentColor' : 'none'}
            strokeWidth={index < rounded ? 0 : 1.5}
          />
        ))}
      </span>
      <span className="sr-only">Nota {average.toLocaleString('pt-BR')} de 5,</span>
      <span>{count} avaliações de colecionadores</span>
    </p>
  )
}

/** Mobile pill: ★ 4.8 (19). */
export function RatingChip({ average, count }: { average: number; count: number }) {
  return (
    <p className="inline-flex h-[26px] items-center gap-1 rounded-full border border-primary px-2 text-sm text-foreground">
      <Star
        className="size-3.5 text-highlight"
        fill="currentColor"
        strokeWidth={0}
        aria-hidden="true"
      />
      <span className="sr-only">Nota</span>
      {average.toFixed(1)}
      <span className="text-muted-foreground">
        ({count}
        <span className="sr-only"> avaliações</span>)
      </span>
    </p>
  )
}
