import { TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Quote, Wallet } from '@/shared/contracts'
import { formatEth } from '@/shared/money/eth'

import { OrderLines } from './order-lines'
import { NETWORK_OPTIONS, shortAddress, WALLET_TYPE_LABEL } from './wallet-format'

/**
 * Final review with the server quote. The collector confirms exactly these values; if the API
 * reports a changed quote, this dialog reopens with the new values and a warning.
 */
export function ReviewDialog({
  quote,
  wallet,
  changed,
  submitting,
  onConfirm,
  onClose,
}: {
  quote: Quote | null
  wallet: Wallet | undefined
  changed: boolean
  submitting: boolean
  onConfirm: (quote: Quote) => void
  onClose: () => void
}) {
  return (
    <Dialog open={quote !== null} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-border bg-card sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Revise seu pedido</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Confira itens, taxas e carteira antes de confirmar o pagamento.
          </DialogDescription>
        </DialogHeader>
        {quote && (
          <>
            {changed && (
              <p
                role="alert"
                className="flex gap-2 rounded-sm border border-warning/70 bg-warning/10 p-3 text-sm text-foreground"
              >
                <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden="true" />
                Preço, disponibilidade ou taxas mudaram desde a última revisão. Confira os novos
                valores e confirme novamente.
              </p>
            )}
            <OrderLines lines={quote.lines.map((line) => ({ ...line, id: line.itemId }))} compact />
            <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatEth(quote.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{quote.coupon?.label ?? 'Desconto'}</dt>
                <dd>(-) {formatEth(quote.discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>
                  Taxa de rede (
                  {NETWORK_OPTIONS.find((option) => option.value === quote.network)?.label})
                </dt>
                <dd>{formatEth(quote.networkFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="text-highlight">{formatEth(quote.total)}</dd>
              </div>
              {wallet && (
                <div className="flex justify-between text-muted-foreground">
                  <dt>Carteira</dt>
                  <dd>
                    {WALLET_TYPE_LABEL[wallet.type]} · {shortAddress(wallet.address)}
                  </dd>
                </div>
              )}
            </dl>
            <DialogFooter className="gap-2">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Voltar
              </Button>
              <Button
                onClick={() => onConfirm(quote)}
                disabled={submitting}
                aria-describedby="review-total"
              >
                {submitting
                  ? 'Enviando pedido…'
                  : `Confirmar pagamento de ${formatEth(quote.total)}`}
              </Button>
            </DialogFooter>
            <p id="review-total" className="sr-only">
              Total a pagar {formatEth(quote.total)}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
