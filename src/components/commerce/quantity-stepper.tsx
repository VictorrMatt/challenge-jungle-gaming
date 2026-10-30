import { Minus, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

type Variant = 'pill' | 'bar' | 'compact' | 'round'

const ORANGE =
  'border border-background bg-primary text-primary-foreground shadow-[0_4px_6px_rgba(20,13,10,0.15)]'

const BUTTON: Record<Variant, string> = {
  /** Desktop detail: tall orange pills (Figma 33×49.5). */
  pill: `h-[49.5px] w-[33px] rounded-[33px] ${ORANGE} [&_svg]:size-[26px]`,
  /** Mobile detail buy bar (Figma 20×30). */
  bar: `h-[30px] w-5 rounded-[20px] ${ORANGE} [&_svg]:size-4`,
  /** Desktop cart / mobile buy bar: small orange rounded squares. */
  compact: 'h-6 w-[18px] rounded-full bg-primary text-primary-foreground [&_svg]:size-3.5',
  /** Mobile cart (Figma): 24px raised circles with a hairline border. */
  round: 'size-6 rounded-full border border-border bg-secondary text-foreground [&_svg]:size-3.5',
}

/**
 * Integer quantity control bounded by [min, max]. Buttons disable at the limits; the value is
 * exposed as a live region so screen readers hear each change.
 */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label,
  disabled = false,
  variant = 'pill',
  className,
}: {
  value: number
  min?: number
  max: number
  onChange: (next: number) => void
  label: string
  disabled?: boolean
  variant?: Variant
  className?: string
}) {
  const gap = variant === 'pill' || variant === 'bar' || variant === 'round' ? 'gap-3' : 'gap-2'
  const valueClass = {
    pill: 'text-xl leading-7',
    bar: 'text-lg leading-[25px] font-medium',
    compact: 'text-base',
    round: 'text-base leading-[22px] min-w-[13px]',
  }[variant]
  const decrementDisabled = disabled || value <= min
  const incrementDisabled = disabled || value >= max

  return (
    <div role="group" aria-label={label} className={cn('inline-flex items-center', gap, className)}>
      <button
        type="button"
        className={cn(
          'grid place-items-center transition-opacity disabled:cursor-not-allowed [&:disabled_svg]:opacity-45',
          BUTTON[variant],
        )}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={decrementDisabled}
        aria-label="Diminuir quantidade"
      >
        <Minus strokeWidth={2.5} aria-hidden="true" />
      </button>
      <output
        aria-live="polite"
        aria-label={`Quantidade: ${value}`}
        className={cn('min-w-3 text-center tabular-nums', valueClass)}
      >
        {value}
      </output>
      <button
        type="button"
        className={cn(
          'grid place-items-center transition-opacity disabled:cursor-not-allowed [&:disabled_svg]:opacity-45',
          BUTTON[variant],
        )}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={incrementDisabled}
        aria-label={
          incrementDisabled && !disabled
            ? `Aumentar quantidade (máximo ${max})`
            : 'Aumentar quantidade'
        }
      >
        <Plus strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  )
}
