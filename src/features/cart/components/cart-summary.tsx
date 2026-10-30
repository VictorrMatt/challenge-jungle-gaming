import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage, isApiClientError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { applyCouponRequest, type Cart } from '@/shared/contracts'
import { formatEth } from '@/shared/money/eth'

import { useApplyCoupon, useRemoveCoupon } from '../hooks'

export function CouponForm({
  cart,
  variant = 'desktop',
}: {
  cart: Cart
  variant?: 'desktop' | 'mobile'
}) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const inputId = useId()
  const errorId = useId()
  const form = useForm({ resolver: zodResolver(applyCouponRequest), defaultValues: { code: '' } })
  const error = form.formState.errors.code?.message

  if (cart.coupon) {
    return (
      <div
        className="flex items-center justify-between gap-2 rounded-sm border border-primary/60 px-3 py-2 text-sm"
        role="status"
      >
        <span>
          Cupom <strong className="text-highlight">{cart.coupon.code}</strong> aplicado
        </span>
        <button
          type="button"
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => toast.success('Cupom removido.'),
              onError: (mutationError) => toast.error(errorMessage(mutationError)),
            })
          }
          disabled={remove.isPending}
          className="inline-flex items-center gap-1 text-highlight hover:underline"
        >
          <X className="size-4" aria-hidden="true" /> Remover
        </button>
      </div>
    )
  }

  const onSubmit = form.handleSubmit(({ code }) =>
    apply.mutate(code, {
      onSuccess: (updated) => {
        form.reset()
        toast.success(`Cupom ${updated.coupon?.code} aplicado: ${updated.coupon?.label}.`)
      },
      onError: (mutationError) => {
        const message =
          isApiClientError(mutationError) &&
          mutationError.is('COUPON_EXPIRED', 'COUPON_INVALID', 'CART_EMPTY')
            ? mutationError.message
            : errorMessage(mutationError)
        form.setError('code', { message }, { shouldFocus: true })
      },
    }),
  )

  return (
    <form onSubmit={onSubmit} noValidate>
      <label
        htmlFor={inputId}
        className={cn(
          'text-sm leading-4 font-bold text-foreground',
          variant === 'mobile' && 'sr-only',
        )}
      >
        Código promocional
      </label>
      <div
        className={cn(
          'flex overflow-hidden',
          variant === 'desktop'
            ? 'mt-2 h-10 rounded-[3px] border border-primary'
            : 'h-[50px] rounded-[40px] border border-border bg-card shadow-[0_6px_10px_rgba(10,6,4,0.45)]',
          error && 'border-destructive',
        )}
      >
        <input
          id={inputId}
          {...form.register('code')}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-foreground uppercase outline-none placeholder:text-subtle-foreground placeholder:normal-case',
            variant === 'desktop' ? 'px-2 text-xs leading-4' : 'pl-4 text-[13px] leading-[22px]',
          )}
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className={cn(
            'shrink-0 font-bold text-primary-foreground disabled:opacity-60',
            variant === 'desktop'
              ? 'w-[102px] bg-primary text-[15px] leading-4'
              : 'm-0 w-[97px] rounded-[40px] bg-[linear-gradient(96deg,rgb(210_138_76/0.54)_0.94%,var(--kurio-500)_105%)] text-[15px] leading-4 text-foreground',
          )}
        >
          {apply.isPending ? '…' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}

export function SummaryRows({
  cart,
  className,
  variant = 'desktop',
}: {
  cart: Cart
  className?: string
  variant?: 'desktop' | 'mobile'
}) {
  const { summary } = cart
  const mobile = variant === 'mobile'
  // Mobile (Figma): 15px labels, 16px amounts, 12px gaps; desktop keeps the 18px amounts.
  const amount = mobile ? 'text-base leading-4' : 'text-lg leading-4'
  return (
    <dl
      className={cn(
        'text-foreground',
        'flex flex-col gap-3 text-[15px] leading-[normal]',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <dt>Subtotal</dt>
        <dd className={amount}>{formatEth(summary.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>{cart.coupon ? cart.coupon.label : 'Desconto do lançamento'}</dt>
        <dd>(-) {formatEth(summary.discount, { withUnit: cart.coupon !== null })}</dd>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <dt>Taxa de rede</dt>
          <dd className={amount}>{formatEth(summary.networkFee)}</dd>
        </div>
        <p className={cn('text-right text-xs leading-4 text-highlight', !mobile && 'mt-3')}>
          Taxa estimada
        </p>
      </div>
    </dl>
  )
}

export function CartTotal({ cart }: { cart: Cart; variant?: 'desktop' | 'mobile' }) {
  return (
    <p className={cn('flex items-center justify-between text-base leading-4 font-bold')}>
      <span>Total</span>
      <span className="text-lg text-highlight" aria-live="polite">
        {formatEth(cart.summary.total)}
      </span>
    </p>
  )
}

function SummaryRowSkeleton({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className={cn('h-4 rounded-sm', label)} />
      <Skeleton className={cn('h-4 rounded-sm', value)} />
    </div>
  )
}

/** Mirrors the desktop summary: coupon field, three label/value rows, total and CTA. */
export function SummarySkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-4 w-36 rounded-sm" />
      <Skeleton className="mt-3 h-10 w-full rounded-sm" />
      <div className="mt-6 space-y-4">
        <SummaryRowSkeleton label="w-20" value="w-24" />
        <SummaryRowSkeleton label="w-40" value="w-16" />
        <SummaryRowSkeleton label="w-28" value="w-20" />
      </div>
      <div className="mt-8">
        <SummaryRowSkeleton label="w-14" value="w-28" />
      </div>
      <Skeleton className="mt-4 h-10 w-full rounded-md" />
    </div>
  )
}
