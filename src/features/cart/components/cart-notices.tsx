import { TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/api/errors'
import type { Cart } from '@/shared/contracts'

import { useAcknowledgeCart } from '../hooks'

/**
 * Lists price/availability changes detected by the server (e.g. after `nft.updated`).
 * The collector must acknowledge them before checking out.
 */
export function CartNotices({ cart }: { cart: Cart }) {
  const acknowledge = useAcknowledgeCart()
  if (cart.notices.length === 0) return null

  return (
    <div role="alert" className="mb-5 rounded-sm border border-warning/70 bg-warning/10 p-4">
      <p className="flex items-center gap-2 font-bold text-warning">
        <TriangleAlert className="size-5" aria-hidden="true" /> Itens do carrinho mudaram enquanto
        você navegava
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-foreground">
        {cart.notices.map((notice) => (
          <li key={`${notice.kind}-${notice.itemId}`}>{notice.message}</li>
        ))}
      </ul>
      <Button
        size="sm"
        className="mt-3"
        disabled={acknowledge.isPending}
        onClick={() =>
          acknowledge.mutate(undefined, {
            onSuccess: () => toast.success('Carrinho atualizado com os valores atuais.'),
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      >
        Entendi, atualizar carrinho
      </Button>
    </div>
  )
}
