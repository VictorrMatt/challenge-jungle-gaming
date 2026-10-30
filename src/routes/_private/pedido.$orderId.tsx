import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ExternalLink, X } from 'lucide-react'

import { ErrorState } from '@/components/feedback/error-state'
import { NotFoundPage } from '@/components/feedback/not-found'
import { PageSpinner } from '@/components/feedback/page-spinner'
import { ThankYouIllustration } from '@/components/icons/brand-icons'
import { ResponsiveImage } from '@/components/responsive-image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { OrderStatusPanel } from '@/features/checkout/components/order-status-panel'
import {
  NETWORK_OPTIONS,
  shortAddress,
  WALLET_TYPE_LABEL,
} from '@/features/checkout/components/wallet-format'
import { useOrder } from '@/features/checkout/use-checkout'
import { errorMessage, isApiClientError } from '@/lib/api/errors'
import type { Order } from '@/shared/contracts'
import { formatEth } from '@/shared/money/eth'

export const Route = createFileRoute('/_private/pedido/$orderId')({
  head: () => ({ meta: [{ title: 'Confirmação do pedido — Kurio' }] }),
  component: OrderPage,
})

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/** Figma receipt format: "29 Jul, 2026". */
function formatReceiptDate(iso: string) {
  const date = new Date(iso)
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}

function OrderPage() {
  const { orderId } = Route.useParams()
  const navigate = useNavigate()
  const { data: order, isPending, isError, error, refetch, isFetching } = useOrder(orderId)

  if (isPending) return <PageSpinner />
  if (isError) {
    if (isApiClientError(error) && error.is('NOT_FOUND')) {
      return (
        <NotFoundPage
          title="Pedido não encontrado"
          description="Este pedido não existe ou não pertence à sua conta."
        />
      )
    }
    return (
      <div className="container-page py-16">
        <ErrorState
          description={errorMessage(error)}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      </div>
    )
  }
  // The receipt is shown ONLY for orders the simulation actually confirmed.
  if (order.status !== 'confirmed') {
    return (
      <div className="container-page py-16">
        <OrderStatusPanel order={order} onRetry={() => void navigate({ to: '/pagamento' })} />
      </div>
    )
  }
  return <Receipt order={order} onClose={() => void navigate({ to: '/' })} />
}

/** Receipt modal (Figma "Confirmação de Pedido"). Values come from the immutable snapshot. */
function Receipt({ order, onClose }: { order: Order; onClose: () => void }) {
  const { receipt, transaction } = order
  const network =
    NETWORK_OPTIONS.find((option) => option.value === receipt.network)?.label ?? receipt.network
  const explorer =
    receipt.network === 'polygon'
      ? 'Polygonscan'
      : receipt.network === 'solana'
        ? 'Solscan'
        : 'Etherscan'
  const facts: Array<[label: string, value: string, strong: boolean]> = [
    ['ID da transação', transaction ? shortAddress(transaction.hash) : '—', true],
    ['Data', formatReceiptDate(transaction?.confirmedAt ?? order.updatedAt), false],
    ['Total', formatEth(receipt.total), false],
    ['Carteira', WALLET_TYPE_LABEL[receipt.wallet.type], true],
  ]

  return (
    <div className="min-h-[60vh]">
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[92dvh] w-[578px] max-w-[calc(100vw-1.5rem)] gap-0 overflow-y-auto rounded-none border-0 bg-card p-0 sm:max-w-[578px]"
        >
          <div className="flex flex-col items-center px-6 pt-5 pb-7 text-center">
            <ThankYouIllustration className="h-[82px] w-[68px] text-primary" />
            <DialogTitle className="mt-3 text-lg font-bold text-muted-foreground">
              Seus NFTs agora estão na sua carteira
            </DialogTitle>
            <DialogDescription className="sr-only">
              Pedido {order.id} confirmado. Recibo da transação.
            </DialogDescription>
          </div>

          <dl className="grid grid-cols-2 gap-y-3 border-y border-primary px-6 py-3 text-sm sm:grid-cols-4 sm:px-9">
            {facts.map(([label, value, strong], index) => (
              <div key={label} className={index > 0 ? 'sm:border-l sm:border-primary sm:pl-4' : ''}>
                <dt className={strong ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                  {label}
                </dt>
                <dd className="whitespace-nowrap text-muted-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="detalhes-transacao" className="px-6 pt-6 sm:px-11">
            <h2 id="detalhes-transacao" className="text-base font-bold text-foreground">
              Detalhes da transação
            </h2>
            <table className="mt-2 w-full text-left">
              <caption className="sr-only">Itens comprados</caption>
              <thead>
                <tr className="border-b border-border-accent text-base text-foreground">
                  <th scope="col" className="pb-2 font-bold">
                    NFTs
                  </th>
                  <th scope="col" className="pb-2 text-center font-bold">
                    Edições
                  </th>
                  <th scope="col" className="pb-2 text-right font-bold">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipt.lines.map((line) => (
                  <tr key={line.itemId}>
                    <td className="py-1.5">
                      <div className="flex items-center gap-3">
                        <ResponsiveImage
                          src={line.image}
                          alt=""
                          sizes="70px"
                          width={70}
                          height={70}
                          className="size-[66px] rounded-sm sm:size-[70px]"
                        />
                        <div>
                          <p className="font-bold text-foreground">{line.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ID do token: {line.tokenId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center text-sm text-muted-foreground">
                      (x {line.quantity})
                    </td>
                    <td className="text-right text-lg font-bold whitespace-nowrap text-highlight">
                      {formatEth(line.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 ml-auto w-full space-y-1 border-b border-border-accent pb-2 sm:w-[322px]">
              {receipt.coupon && (
                <div className="flex justify-between text-base">
                  <dt>Desconto ({receipt.coupon.code})</dt>
                  <dd>(-) {formatEth(receipt.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-base">
                <dt>Taxa de rede</dt>
                <dd className="text-lg">{formatEth(receipt.networkFee)}</dd>
              </div>
              <div className="flex justify-between font-bold">
                <dt>Total</dt>
                <dd className="text-lg text-highlight">{formatEth(receipt.total)}</dd>
              </div>
            </dl>
            <p className="mt-5 text-center text-sm leading-[1.6] text-muted-foreground">
              Transação confirmada na {network}. A propriedade foi transferida para sua carteira
              conectada ({shortAddress(receipt.wallet.address)}) e registrada na rede.
            </p>
          </section>

          <div className="flex justify-center px-6 pt-6 pb-8">
            {transaction && (
              <Button asChild className="h-11 px-6">
                <a href={transaction.explorerUrl} target="_blank" rel="noopener noreferrer">
                  Ver no {explorer}{' '}
                  <span className="sr-only">(link simulado, abre em nova aba)</span>
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            )}
          </div>
          <DialogClose
            className="absolute top-5 right-5 grid size-8 place-items-center text-highlight hover:text-foreground"
            aria-label="Fechar e voltar ao início"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}
