import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown, ShoppingCart } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { FormField } from '@/components/form/form-field'
import { FormSelect } from '@/components/form/form-select'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile, useWallets } from '@/features/account/hooks'
import { CartNotices } from '@/features/cart/components/cart-notices'
import { SummaryRows } from '@/features/cart/components/cart-summary'
import { useCart } from '@/features/cart/hooks'
import { OrderLines } from '@/features/checkout/components/order-lines'
import { OrderStatusPanel } from '@/features/checkout/components/order-status-panel'
import { ReviewDialog } from '@/features/checkout/components/review-dialog'
import { NETWORK_OPTIONS, WALLET_TYPE_LABEL } from '@/features/checkout/components/wallet-format'
import {
  ConnectionStatus,
  ProviderList,
  RegisteredWallets,
} from '@/features/checkout/components/wallet-picker'
import { useCheckout, useOrder, usePendingOrders } from '@/features/checkout/use-checkout'
import { errorMessage, isApiClientError } from '@/lib/api/errors'
import { buyerDetails, networkId, type Wallet, type WalletType } from '@/shared/contracts'
import { formatEth } from '@/shared/money/eth'

export const Route = createFileRoute('/_private/pagamento')({
  head: () => ({ meta: [{ title: 'Pagamento — Kurio' }] }),
  component: CheckoutPage,
})

const checkoutForm = buyerDetails.extend({
  network: networkId,
  walletId: z.string().min(1, 'Selecione uma carteira'),
})
type CheckoutForm = z.infer<typeof checkoutForm>

function CheckoutPage() {
  const navigate = useNavigate()
  const cart = useCart()
  const profile = useProfile()
  const wallets = useWallets()
  const pending = usePendingOrders()
  const checkout = useCheckout()
  const order = useOrder(checkout.draft.orderId)
  const recovered = useRef(false)
  const finished = useRef(false)

  // After a refresh mid-submission: re-send the persisted attempt (same key → same order).
  useEffect(() => {
    if (recovered.current) return
    recovered.current = true
    if (checkout.draft.attempt && !checkout.draft.orderId) checkout.recover.mutate()
  }, [checkout])

  // Terminal state reached: confirmation screen only for an order the API confirmed.
  const status = order.data?.status
  useEffect(() => {
    if (status === 'confirmed' && order.data && !finished.current) {
      finished.current = true
      checkout.finish()
      toast.success('Pagamento confirmado! Seus NFTs estão na sua carteira.')
      void navigate({ to: '/pedido/$orderId', params: { orderId: order.data.id }, replace: true })
    }
  }, [status, order.data, checkout, navigate])

  if (cart.isError || profile.isError || wallets.isError) {
    const error = cart.error ?? profile.error ?? wallets.error
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Não foi possível carregar o pagamento"
          description={errorMessage(error)}
          onRetry={() => {
            void cart.refetch()
            void profile.refetch()
            void wallets.refetch()
          }}
        />
      </div>
    )
  }

  const loading = cart.isPending || profile.isPending || wallets.isPending
  const otherPending = pending.data?.items.find((item) => item.id !== checkout.draft.orderId)

  return (
    <>
      <MobileTopBar title="Pagamento com carteira" fallback="/carrinho" />
      <div className="container-page md:pt-6">
        <nav aria-label="Trilha de navegação" className="hidden md:block">
          <ol className="flex gap-2 text-base leading-[1.4] font-bold text-foreground">
            <li>
              <Link to="/" className="hover:text-highlight">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/carrinho" className="hover:text-highlight">
                Mercado
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Pagamento</li>
          </ol>
        </nav>
        <h1 className="sr-only">Pagamento</h1>

        {otherPending && !checkout.draft.orderId && (
          <p role="status" className="mt-4 rounded-sm border border-primary/60 bg-card p-3 text-sm">
            Você tem um pedido em processamento ({otherPending.id}).{' '}
            <Link
              to="/pedido/$orderId"
              params={{ orderId: otherPending.id }}
              className="font-bold text-highlight hover:underline"
            >
              Acompanhar pedido
            </Link>
          </p>
        )}

        {checkout.recover.isPending ? (
          <section role="status" className="mt-10 rounded-md bg-card p-8 text-center">
            Recuperando seu pedido em andamento…
          </section>
        ) : order.data && order.data.status !== 'confirmed' ? (
          <div className="mt-10">
            <OrderStatusPanel order={order.data} onRetry={checkout.resetAfterDecline} />
          </div>
        ) : loading ? (
          <CheckoutSkeleton />
        ) : cart.data && cart.data.items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart />}
            title="Não há itens para pagar"
            description="Seu carrinho está vazio."
            action={
              <Button asChild>
                <Link to="/" hash="catalogo">
                  Explorar o mercado
                </Link>
              </Button>
            }
          />
        ) : (
          cart.data &&
          profile.data &&
          wallets.data && (
            <CheckoutForm
              checkout={checkout}
              cart={cart.data}
              profile={profile.data}
              wallets={wallets.data}
            />
          )
        )}
      </div>
    </>
  )
}

function CheckoutForm({
  checkout,
  cart,
  profile,
  wallets,
}: {
  checkout: ReturnType<typeof useCheckout>
  cart: NonNullable<ReturnType<typeof useCart>['data']>
  profile: NonNullable<ReturnType<typeof useProfile>['data']>
  wallets: NonNullable<ReturnType<typeof useWallets>['data']>
}) {
  const registered = [wallets.primary, wallets.secondary].filter(
    (wallet): wallet is Wallet => wallet !== null,
  )
  const saved = checkout.draft.form as Partial<CheckoutForm> | undefined
  const initialWallet =
    registered.find((wallet) => wallet.id === (saved?.walletId ?? checkout.draft.walletId)) ??
    registered[0]

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutForm),
    mode: 'onTouched',
    defaultValues: {
      displayName: profile.displayName,
      username: profile.username,
      profileName: initialWallet?.profileName ?? profile.username,
      email: profile.email,
      referralCode: initialWallet?.referralCode ?? '',
      ensName: profile.ensName || initialWallet?.ensName || '',
      note: '',
      network: initialWallet?.network ?? 'ethereum',
      walletId: initialWallet?.id ?? '',
      ...saved,
    },
  })
  const { errors } = form.formState
  const walletId = useWatch({ control: form.control, name: 'walletId' })
  const network = useWatch({ control: form.control, name: 'network' })
  const wallet = registered.find((candidate) => candidate.id === walletId)
  const session = checkout.draft.walletSession
  const connected =
    session?.status === 'connected' && session.walletId === walletId && session.network === network
  const busy = checkout.connect.isPending || checkout.review.isPending || checkout.place.isPending
  const blocked = cart.notices.length > 0

  // Persist the draft so session expiry / refresh resumes with the same data.
  const draftValues = useWatch({ control: form.control })
  const serializedDraft = JSON.stringify(draftValues)
  const { save } = checkout
  useEffect(() => {
    save({ form: JSON.parse(serializedDraft) as Record<string, unknown> })
  }, [serializedDraft, save])

  function selectWallet(next: Wallet) {
    form.setValue('walletId', next.id, { shouldValidate: true })
    form.setValue('network', next.network)
    form.setValue('profileName', next.profileName)
    if (session && session.walletId !== next.id) checkout.disconnect.mutate()
  }

  function selectProvider(type: WalletType) {
    const match = registered.find((candidate) => candidate.type === type)
    if (match) selectWallet(match)
    else
      toast.info(
        `Nenhuma carteira ${WALLET_TYPE_LABEL[type]} cadastrada. Cadastre em Perfil › Carteiras.`,
        { id: 'provider' },
      )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!wallet) return
    try {
      if (!connected) {
        await checkout.connect.mutateAsync({ walletId: wallet.id, network: values.network })
        toast.success(`${WALLET_TYPE_LABEL[wallet.type]} conectada.`)
      }
      await checkout.review.mutateAsync(values.network)
    } catch (error) {
      // Session expiry is handled globally (single notice + login + resume).
      if (isApiClientError(error) && error.is('SESSION_EXPIRED')) return
      if (isApiClientError(error) && error.is('WALLET_REJECTED')) {
        toast.error(
          'A carteira recusou a conexão. Aprove a solicitação na carteira e tente novamente.',
        )
      } else {
        toast.error(errorMessage(error))
      }
    }
  })

  function confirm(quote: NonNullable<typeof checkout.reviewQuote>) {
    const values = form.getValues()
    const { network: chosen, walletId: _wallet, ...buyer } = values
    checkout.place.mutate(
      { quote, buyer, network: chosen },
      {
        onError: (error) => {
          if (isApiClientError(error) && error.is('SESSION_EXPIRED')) return
          if (isApiClientError(error) && error.is('QUOTE_OUTDATED')) {
            toast.warning('Os valores mudaram. Revise e confirme novamente.')
          } else if (isApiClientError(error) && error.is('WALLET_DISCONNECTED')) {
            toast.error('A carteira foi desconectada. Conecte novamente para continuar.')
          } else {
            toast.error(`${errorMessage(error)} Seu carrinho foi mantido.`)
          }
        },
      },
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-6 grid gap-10 pb-40 md:pb-0 lg:grid-cols-[763px_405px] lg:justify-between"
    >
      <section aria-labelledby="perfil-titulo" className="max-md:order-2">
        <details className="group md:contents" open>
          <summary className="cursor-pointer list-none text-lg font-bold text-foreground md:hidden">
            Dados do colecionador{' '}
            <span className="text-sm font-normal text-highlight group-open:hidden">(editar)</span>
          </summary>
          <h2 id="perfil-titulo" className="hidden text-lg font-bold text-foreground md:block">
            Perfil do colecionador
          </h2>
          <div className="mt-4 grid gap-x-6 gap-y-[18px] md:mt-3 md:grid-cols-2">
            <FormField
              label="Nome de exibição"
              required
              error={errors.displayName?.message}
              inputClassName="rounded-none"
              {...form.register('displayName')}
            />
            <FormField
              label="Nome de usuário"
              required
              autoComplete="username"
              error={errors.username?.message}
              inputClassName="rounded-none"
              {...form.register('username')}
            />
            <FormSelect
              label="Rede"
              required
              placeholder="Selecione uma rede"
              options={NETWORK_OPTIONS}
              error={errors.network?.message}
              {...form.register('network')}
            />
            <FormField
              label="Nome do perfil"
              required
              error={errors.profileName?.message}
              inputClassName="rounded-none"
              {...form.register('profileName')}
            />
            <FormField
              label="Endereço da carteira"
              required
              readOnly
              value={wallet?.address ?? ''}
              placeholder="Endereço 0x da carteira"
              hint="Definido pela carteira selecionada."
              inputClassName="rounded-none text-sm text-muted-foreground"
            />
            <FormField
              label="ENS ou carteira secundária (opcional)"
              readOnly
              value={wallet?.secondaryAddress || (wallet?.ensName ? `${wallet.ensName}.eth` : '')}
              placeholder="ENS ou carteira secundária (opcional)"
              className="md:[&>label]:invisible"
              inputClassName="rounded-none text-sm text-muted-foreground"
            />
            <FormField
              label="Tipo de carteira"
              required
              readOnly
              value={wallet ? WALLET_TYPE_LABEL[wallet.type] : ''}
              placeholder="Selecione uma carteira"
              inputClassName="rounded-none text-muted-foreground"
            />
            <FormField
              label="Código de indicação"
              required
              error={errors.referralCode?.message}
              inputClassName="rounded-none uppercase"
              {...form.register('referralCode')}
            />
            <FormField
              label="E-mail"
              required
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              inputClassName="rounded-none"
              {...form.register('email')}
            />
            <FormField
              label="Nome ENS"
              required
              error={errors.ensName?.message}
              inputClassName="rounded-none pl-[96px]"
              leading={
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 flex w-[78px] items-center justify-between border border-input px-3 text-base whitespace-nowrap text-foreground"
                >
                  .eth <ChevronDown className="size-4" />
                </span>
              }
              {...form.register('ensName')}
            />
          </div>

          {wallets.secondary && wallets.primary && (
            <label className="mt-6 flex w-fit cursor-pointer items-center gap-2 text-base text-foreground">
              <input
                type="checkbox"
                className="size-4 accent-[var(--primary)]"
                checked={walletId === wallets.secondary.id}
                onChange={(event) =>
                  selectWallet(event.target.checked ? wallets.secondary! : wallets.primary!)
                }
              />
              Usar outra carteira?
            </label>
          )}

          <div className="mt-6 max-w-[350px]">
            <label htmlFor="buyer-note" className="mb-[7px] block text-base text-foreground">
              Observação do colecionador (opcional)
            </label>
            <textarea
              id="buyer-note"
              rows={6}
              maxLength={280}
              aria-invalid={errors.note ? true : undefined}
              className="w-full resize-none border border-input bg-transparent p-3 text-base text-foreground outline-none focus-visible:border-primary"
              {...form.register('note')}
            />
          </div>
        </details>
      </section>

      <aside aria-labelledby="seus-nfts" className="max-md:order-1">
        <h2 id="seus-nfts" className="hidden text-lg font-bold text-foreground md:block">
          Seus NFTs
        </h2>
        <div className="hidden md:block">
          <p
            className="mt-1 flex justify-between text-base font-bold text-foreground"
            aria-hidden="true"
          >
            <span>NFTs</span>
            <span>Subtotal</span>
          </p>
          <CartNotices cart={cart} />
          <OrderLines lines={cart.items.filter((item) => item.available > 0)} className="mt-2" />
          <p className="mt-4 text-center text-base text-foreground">
            Tem um código promocional?{' '}
            <Link to="/carrinho" className="text-highlight hover:underline">
              Aplique aqui
            </Link>
          </p>
          <SummaryRows cart={cart} className="mt-3" />
          <p className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold">
            <span className="pl-10">Total</span>
            <span className="pr-10 text-highlight">{formatEth(cart.summary.total)}</span>
          </p>
        </div>

        <div className="space-y-6 md:mt-4">
          <div className="md:hidden">
            <RegisteredWallets
              wallets={wallets}
              value={walletId}
              onChange={selectWallet}
              session={session}
            />
          </div>
          {errors.walletId && <p className="text-sm text-destructive">{errors.walletId.message}</p>}
          <ProviderList type={wallet?.type} onSelectType={selectProvider} />
          <ConnectionStatus
            session={session}
            wallet={wallet}
            onDisconnect={() => checkout.disconnect.mutate()}
            disconnecting={checkout.disconnect.isPending}
          />
          {blocked && (
            <p className="text-sm text-warning">
              Revise as alterações do carrinho antes de confirmar.
            </p>
          )}
        </div>

        <div className="max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:bg-background max-md:px-6 max-md:pt-3 max-md:pb-[max(16px,env(safe-area-inset-bottom))]">
          <p className="flex items-center justify-end gap-6 text-xl font-bold md:hidden">
            <span>Total:</span>
            <span className="text-highlight">{formatEth(cart.summary.total)}</span>
          </p>
          <Button
            type="submit"
            variant="default"
            className="mt-3 h-[60px] w-full rounded-full text-base max-md:gradient-primary md:mt-6 md:h-11 md:rounded-sm"
            disabled={busy || blocked || registered.length === 0}
          >
            {checkout.connect.isPending
              ? 'Conectando carteira…'
              : checkout.review.isPending
                ? 'Calculando cotação…'
                : 'Confirmar compra'}
          </Button>
        </div>
      </aside>

      <ReviewDialog
        quote={checkout.reviewQuote}
        wallet={wallet}
        changed={checkout.quoteChanged}
        submitting={checkout.place.isPending}
        onConfirm={confirm}
        onClose={checkout.closeReview}
      />
    </form>
  )
}

function CheckoutSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando pagamento"
      className="mt-6 grid gap-10 lg:grid-cols-[763px_405px] lg:justify-between"
    >
      <div className="grid gap-[18px] md:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-[69px]" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[70px]" />
        ))}
        <Skeleton className="h-40" />
      </div>
    </div>
  )
}
