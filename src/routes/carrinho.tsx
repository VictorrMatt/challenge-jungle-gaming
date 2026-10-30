import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { Button } from '@/components/ui/button'
import { CartCard, CartLinesSkeleton, CartRow } from '@/features/cart/components/cart-lines'
import { CartNotices } from '@/features/cart/components/cart-notices'
import {
  CartTotal,
  CouponForm,
  SummaryRows,
  SummarySkeleton,
} from '@/features/cart/components/cart-summary'
import { useCart } from '@/features/cart/hooks'
import { RelatedNfts } from '@/features/nft/components/related-nfts'
import { errorMessage } from '@/lib/api/errors'

export const Route = createFileRoute('/carrinho')({
  head: () => ({ meta: [{ title: 'Carrinho — Kurio' }] }),
  component: CartPage,
})

function CartPage() {
  const navigate = useNavigate()
  const { data: cart, isPending, isError, error, refetch, isFetching } = useCart()
  const hasItems = Boolean(cart && cart.items.length > 0)
  const purchasable = cart?.items.some((item) => item.available > 0) ?? false
  const blocked = Boolean(cart && cart.notices.length > 0)
  const checkoutLabel = blocked ? 'Revise as alterações' : 'Conectar e finalizar'

  const goToCheckout = () => void navigate({ to: '/pagamento' })

  if (isError) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Não foi possível carregar seu carrinho"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      </div>
    )
  }

  return (
    <>
      <MobileTopBar title="Carrinho de NFTs" />
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
              <Link to="/" hash="catalogo" className="hover:text-highlight">
                Mercado
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Carrinho</li>
          </ol>
        </nav>
        <h1 className="sr-only md:not-sr-only md:hidden">Carrinho de NFTs</h1>

        {!isPending && !hasItems ? (
          <EmptyState
            icon={<ShoppingCart />}
            title="Seu carrinho está vazio"
            description="Explore o mercado e adicione NFTs para continuar."
            action={
              <Button asChild>
                <Link to="/" hash="catalogo">
                  Explorar o mercado
                </Link>
              </Button>
            }
            className="py-20"
          />
        ) : (
          <div className="grid gap-10 pb-56 md:pb-0 lg:grid-cols-[782px_332px] lg:justify-between">
            <section aria-label="Itens do carrinho">
              {cart && <CartNotices cart={cart} />}

              {/* Desktop table */}
              <div className="hidden md:block">
                {isPending ? (
                  <CartLinesSkeleton />
                ) : (
                  <table className="w-full border-separate border-spacing-y-3 text-left">
                    <caption className="sr-only">
                      Itens no carrinho com preço, quantidade e total
                    </caption>
                    <thead>
                      <tr className="text-base font-bold text-foreground">
                        <th scope="col" className="border-b border-border-accent pb-2 font-bold">
                          NFTs
                        </th>
                        <th scope="col" className="border-b border-border-accent pb-2 font-bold">
                          Preço
                        </th>
                        <th scope="col" className="border-b border-border-accent pb-2 font-bold">
                          Edições
                        </th>
                        <th scope="col" className="border-b border-border-accent pb-2 font-bold">
                          Total
                        </th>
                        <th scope="col" className="border-b border-border-accent pb-2">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart?.items.map((item) => (
                        <CartRow key={item.id} item={item} />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Mobile cards */}
              <div className="md:hidden">
                {isPending ? (
                  <CartLinesSkeleton />
                ) : (
                  <ul className="space-y-4">
                    {cart?.items.map((item) => (
                      <CartCard key={item.id} item={item} />
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Desktop summary */}
            <aside aria-labelledby="resumo-titulo" className="hidden md:block">
              <h2
                id="resumo-titulo"
                className="border-b border-border-accent pb-2 text-lg font-bold text-foreground"
              >
                Resumo da carteira
              </h2>
              <div className="mt-6" aria-busy={isFetching}>
                {cart ? (
                  <>
                    <CouponForm cart={cart} />
                    <SummaryRows cart={cart} className="mt-6" />
                    <div className="mt-6">
                      <CartTotal cart={cart} />
                    </div>
                    <Button
                      className="mt-4 w-full"
                      onClick={goToCheckout}
                      disabled={blocked || !purchasable}
                    >
                      {checkoutLabel}
                    </Button>
                  </>
                ) : (
                  <SummarySkeleton />
                )}
                <p className="mt-4 text-center">
                  <Link to="/" hash="catalogo" className="text-base text-highlight hover:underline">
                    Continuar explorando
                  </Link>
                </p>
              </div>
            </aside>
          </div>
        )}

        <div className="hidden md:block">
          <RelatedNfts
            nftId={cart?.items[0]?.nftId ?? 'emerald-ape-042'}
            title="Colecionadores também viram"
          />
        </div>
      </div>

      {/* Mobile summary panel */}
      {hasItems && cart && (
        <aside
          aria-label="Resumo do pedido"
          className="fixed inset-x-0 bottom-0 z-30 rounded-t-[28px] bg-card px-6 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.45)] md:hidden"
        >
          <CouponForm cart={cart} variant="mobile" />
          <SummaryRows cart={cart} className="mt-3 text-sm" />
          <div className="mt-2">
            <CartTotal cart={cart} />
          </div>
          <Button
            variant="gradient"
            size="xl"
            className="mt-4 w-full"
            onClick={goToCheckout}
            disabled={blocked || !purchasable}
          >
            {checkoutLabel}
          </Button>
        </aside>
      )}
    </>
  )
}
