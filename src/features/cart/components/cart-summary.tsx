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
        className={cn('text-sm font-bold text-foreground', variant === 'mobile' && 'sr-only')}
      >
        Código promocional
      </label>
      <div
        className={cn(
          'flex overflow-hidden',
          variant === 'desktop'
            ? 'mt-2.5 h-10 rounded-sm border border-primary'
            : 'h-[50px] rounded-full border border-input bg-background',
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
            variant === 'desktop' ? 'px-2 text-xs' : 'px-4 text-sm',
          )}
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className={cn(
            'shrink-0 font-bold text-primary-foreground disabled:opacity-60',
            variant === 'desktop'
              ? 'w-[102px] bg-primary text-base'
              : 'm-0 w-[96px] rounded-full gradient-primary text-base',
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

export function SummaryRows({ cart, className }: { cart: Cart; className?: string }) {
  const { summary } = cart
  return (
    <dl className={cn('space-y-2 text-base text-foreground', className)}>
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd className="text-lg md:text-lg">{formatEth(summary.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>{cart.coupon ? cart.coupon.label : 'Desconto do lançamento'}</dt>
        <dd>(-) {formatEth(summary.discount, { withUnit: cart.coupon !== null })}</dd>
      </div>
      <div>
        <div className="flex justify-between">
          <dt>Taxa de rede</dt>
          <dd className="text-lg">{formatEth(summary.networkFee)}</dd>
        </div>
        <p className="text-right text-xs text-highlight">Taxa estimada</p>
      </div>
    </dl>
  )
}

export function CartTotal({ cart }: { cart: Cart }) {
  return (
    <p className="flex items-center justify-between text-base font-bold">
      <span>Total</span>
      <span className="text-lg text-highlight" aria-live="polite">
        {formatEth(cart.summary.total)}
      </span>
    </p>
  )
}

export function SummarySkeleton() {
  return (
    <div aria-hidden="true" className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-7 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
