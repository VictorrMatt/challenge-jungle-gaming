import { useId } from 'react'

import { cn } from '@/lib/utils'
import type { Edition, EditionId } from '@/shared/contracts'

/**
 * Edition chips as an accessible radio group. Sold-out editions stay visible (struck through)
 * but cannot be selected; the state is conveyed by text, not only color.
 */
export function EditionPicker({
  editions,
  value,
  onChange,
  className,
}: {
  editions: Edition[]
  value: EditionId | null
  onChange: (edition: EditionId) => void
  className?: string
}) {
  const labelId = useId()
  return (
    <div className={className}>
      <p id={labelId} className="text-[15px] leading-4 font-bold text-foreground">
        Edição:
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="mt-2 flex flex-wrap gap-3 md:mt-3 md:gap-1.5"
      >
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const selected = edition.id === value
          return (
            <button
              key={edition.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={soldOut}
              onClick={() => onChange(edition.id)}
              className={cn(
                // Figma draws the chips as ellipses (28px tall) around the label.
                'h-7 min-w-9 rounded-[50%] border px-[5px] text-sm leading-4 transition-colors',
                selected
                  ? 'border-primary font-medium text-highlight'
                  : 'border-border-soft text-muted-foreground hover:border-primary/70',
                soldOut && 'cursor-not-allowed line-through opacity-50',
              )}
            >
              {edition.label}
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
