import { ChevronDown } from 'lucide-react'
import { forwardRef, useId, type SelectHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

/** Native select styled like the Figma dropdowns (best keyboard/mobile accessibility). */
export const FormSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    label: string
    error?: string
    required?: boolean
    placeholder?: string
    options: Array<{ value: string; label: string }>
    selectClassName?: string
  }
>(function FormSelect(
  { label, error, required, placeholder, options, className, selectClassName, id, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`
  return (
    <div className={className}>
      <label htmlFor={selectId} className="mb-[7px] block text-base leading-[1.4] text-foreground">
        {label}
        {required && (
          <>
            <span className="ml-1 text-lg text-destructive" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </>
        )}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-required={required || undefined}
          className={cn(
            'h-10 w-full appearance-none rounded-none border border-input bg-background pr-10 pl-3 text-base text-foreground outline-none invalid:text-subtle-foreground focus-visible:border-primary aria-invalid:border-destructive',
            selectClassName,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-foreground"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-destructive">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  )
})
