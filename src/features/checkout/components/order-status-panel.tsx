import { Link } from '@tanstack/react-router'
import { Loader2, OctagonX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Order } from '@/shared/contracts'
import { formatEth } from '@/shared/money/eth'

/** Pending / declined order states (the confirmed state has its own receipt screen). */
export function OrderStatusPanel({ order, onRetry }: { order: Order; onRetry: () => void }) {
  if (order.status === 'pending') {
    return (
      <section
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 rounded-md border border-primary/60 bg-card px-6 py-10 text-center"
      >
        <Loader2 className="size-10 animate-spin text-highlight" aria-hidden="true" />
        <h2 className="text-xl font-bold">Pagamento em processamento</h2>
        <p className="max-w-md text-muted-foreground">
          Pedido <strong className="text-foreground">{order.id}</strong> de{' '}
          {formatEth(order.receipt.total)} aguardando confirmação da rede. Você pode recarregar a
          página ou perder a conexão: o pedido continua sendo acompanhado e não será duplicado.
        </p>
      </section>
    )
  }
  if (order.status === 'declined') {
    return (
      <section
        role="alert"
        className="flex flex-col items-center gap-3 rounded-md border border-destructive/60 bg-card px-6 py-10 text-center"
      >
        <OctagonX className="size-10 text-destructive" aria-hidden="true" />
        <h2 className="text-xl font-bold">Pagamento recusado</h2>
        <p className="max-w-md text-muted-foreground">
          {order.declineReason ?? 'A rede recusou a transação.'} Seus itens continuam no carrinho.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onRetry}>Tentar novamente</Button>
          <Button variant="outline" asChild>
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
        </div>
      </section>
    )
  }
  return null
}
