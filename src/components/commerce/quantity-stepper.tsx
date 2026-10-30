import { Minus, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

type Variant = 'pill' | 'compact' | 'round'

const BUTTON: Record<Variant, string> = {
  /** Desktop detail: tall orange pills. */
  pill: 'h-[46px] w-[31px] rounded-full bg-primary text-primary-foreground [&_svg]:size-5',
  /** Desktop cart / mobile buy bar: small orange rounded squares. */
  compact: 'h-6 w-[18px] rounded-full bg-primary text-primary-foreground [&_svg]:size-3.5',
  /** Mobile cart: dark round buttons. */
  round: 'size-6 rounded-full bg-background/60 text-foreground [&_svg]:size-3.5',
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
  const decrementDisabled = disabled || value <= min
  const incrementDisabled = disabled || value >= max

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-center',
        variant === 'pill' ? 'gap-2.5' : 'gap-2',
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          'grid place-items-center transition-opacity disabled:cursor-not-allowed disabled:opacity-60',
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
        className={cn(
          'min-w-6 text-center tabular-nums',
          variant === 'pill' ? 'text-[22px]' : 'text-base',
        )}
      >
        {value}
      </output>
      <button
        type="button"
        className={cn(
          'grid place-items-center transition-opacity disabled:cursor-not-allowed disabled:opacity-60',
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
