import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  /** Visually hide the label (placeholder-only Figma fields keep an accessible name). */
  hideLabel?: boolean
  required?: boolean
  inputClassName?: string
  /** Rendered inside the input box on the right (e.g. password toggle). */
  adornment?: ReactNode
  leading?: ReactNode
}

/**
 * Label + input + error, wired for assistive tech: `aria-invalid`, `aria-describedby` pointing
 * to the error/hint, required marker shown as "*" and announced as "obrigatório".
 */
export const FormField = forwardRef<HTMLInputElement, FieldProps>(function FormField(
  {
    label,
    error,
    hint,
    hideLabel,
    required,
    className,
    inputClassName,
    adornment,
    leading,
    id,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className={cn(
          // Figma: 15px label; the 22px coral asterisk makes required labels 29px tall.
          'flex items-center text-[15px] leading-[15px] text-foreground',
          required ? 'mb-1.5' : 'mb-3',
          hideLabel && 'sr-only',
        )}
      >
        {label}
        {required && (
          <span
            className="-my-1 ml-0.5 text-[22px] leading-none text-destructive"
            aria-hidden="true"
          >
            *
          </span>
        )}
        {required && <span className="sr-only"> (obrigatório)</span>}
      </label>
      <div className="relative flex">
        {leading}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            'h-10 w-full min-w-0 rounded-[3px] border border-input bg-transparent px-3 text-[15px] text-foreground transition-colors outline-none placeholder:text-subtle-foreground focus-visible:border-primary aria-invalid:border-destructive',
            adornment && 'pr-11',
            inputClassName,
          )}
          {...props}
        />
        {adornment && (
          <div className="absolute inset-y-0 right-2 flex items-center">{adornment}</div>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-destructive">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  )
})

/** Password field with show/hide toggle (Figma eye icon). */
export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, 'type' | 'adornment'>>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <FormField
        ref={ref}
        type={visible ? 'text' : 'password'}
        adornment={
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            className="grid size-8 place-items-center rounded-sm text-subtle-foreground/70 hover:text-foreground"
          >
            {visible ? (
              <Eye className="size-4" aria-hidden="true" />
            ) : (
              <EyeOff className="size-4" aria-hidden="true" />
            )}
          </button>
        }
        {...props}
      />
    )
  },
)

/** Form-level error (e.g. invalid credentials) announced immediately. */
export function FormAlert({ message, className }: { message: string | null; className?: string }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className={cn(
        'rounded-sm border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-foreground',
        className,
      )}
    >
      {message}
    </p>
  )
}
