import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { QuantityStepper } from '@/components/commerce/quantity-stepper'
import { ResponsiveImage } from '@/components/responsive-image'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/shared/contracts'
import { formatEth, isEqual } from '@/shared/money/eth'

import { useRemoveCartItem, useUpdateCartItem } from '../hooks'

function useLineActions(item: CartItem) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  return {
    pending: update.isPending || remove.isPending,
    setQuantity: (quantity: number) =>
      update.mutate(
        { itemId: item.id, quantity },
        { onError: (error) => toast.error(errorMessage(error)) },
      ),
    remove: () =>
      remove.mutate(item.id, {
        onSuccess: () => toast.success(`${item.name} removido do carrinho.`),
        onError: (error) => toast.error(errorMessage(error)),
      }),
  }
}

function PriceChange({ item }: { item: CartItem }) {
  if (isEqual(item.unitPrice, item.acknowledgedUnitPrice)) return null
  return (
    <span className="block text-xs font-normal text-warning">
      <span className="sr-only">Preço anterior: </span>
      <s>{formatEth(item.acknowledgedUnitPrice)}</s> → atualizado
    </span>
  )
}

/** Desktop table row (Figma "Carrinho de NFTs"). */
export function CartRow({ item }: { item: CartItem }) {
  const actions = useLineActions(item)
  const soldOut = item.available === 0
  return (
    <tr className={cn('h-[70px] bg-card align-middle', soldOut && 'opacity-60')}>
      <td className="w-[311px] p-0">
        <div className="flex items-center gap-4">
          <ResponsiveImage
            src={item.image}
            alt=""
            sizes="70px"
            width={70}
            height={70}
            className="size-[70px]"
          />
          <div className="min-w-0">
            <Link
              to="/nft/$nftId"
              params={{ nftId: item.nftId }}
              search={{ edicao: item.editionId }}
              className="block truncate text-base font-bold text-foreground hover:text-highlight"
            >
              {item.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              ID do token: {item.tokenId} · {item.editionLabel}
            </p>
          </div>
        </div>
      </td>
      <td className="w-[138px] text-base font-bold text-muted-foreground">
        {formatEth(item.unitPrice)}
        <PriceChange item={item} />
      </td>
      <td className="w-[136px]">
        {soldOut ? (
          <span className="text-sm font-bold text-destructive">Esgotado</span>
        ) : (
          <QuantityStepper
            variant="compact"
            value={Math.min(item.quantity, item.maxQuantity)}
            max={item.maxQuantity}
            onChange={actions.setQuantity}
            disabled={actions.pending}
            label={`Quantidade de ${item.name}`}
          />
        )}
      </td>
      <td className="w-[150px] text-base font-bold text-highlight">{formatEth(item.lineTotal)}</td>
      <td className="pr-6 text-right">
        <button
          type="button"
          onClick={actions.remove}
          disabled={actions.pending}
          aria-label={`Remover ${item.name} do carrinho`}
          className="grid size-8 place-items-center rounded-sm text-highlight hover:bg-primary/10 disabled:opacity-50"
        >
          <Trash2 className="size-5" aria-hidden="true" />
        </button>
      </td>
    </tr>
  )
}

/** Mobile card (Figma mobile cart). */
export function CartCard({ item }: { item: CartItem }) {
  const actions = useLineActions(item)
  const soldOut = item.available === 0
  return (
    <li
      className={cn('flex gap-2 overflow-hidden rounded-xl bg-card pr-3', soldOut && 'opacity-60')}
    >
      <ResponsiveImage
        src={item.image}
        alt=""
        sizes="100px"
        width={100}
        height={100}
        className="size-[100px] shrink-0"
      />
      <div className="min-w-0 flex-1 py-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            to="/nft/$nftId"
            params={{ nftId: item.nftId }}
            className="truncate text-sm font-bold text-foreground"
          >
            {item.name}
          </Link>
          <button
            type="button"
            onClick={actions.remove}
            disabled={actions.pending}
            aria-label={`Remover ${item.name}`}
            className="shrink-0 text-highlight"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Edição: {item.editionLabel}</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="text-base leading-none font-bold whitespace-nowrap text-highlight">
            {formatEth(item.lineTotal)}
            <PriceChange item={item} />
          </p>
          {soldOut ? (
            <span className="text-sm font-bold text-destructive">Esgotado</span>
          ) : (
            <QuantityStepper
              variant="round"
              value={Math.min(item.quantity, item.maxQuantity)}
              max={item.maxQuantity}
              onChange={actions.setQuantity}
              disabled={actions.pending}
              label={`Quantidade de ${item.name}`}
            />
          )}
        </div>
      </div>
    </li>
  )
}

export function CartLinesSkeleton() {
  return (
    <div role="status" aria-label="Carregando carrinho" className="space-y-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton
          key={index}
          className="h-[70px] w-full rounded-none max-md:h-[100px] max-md:rounded-xl"
        />
      ))}
    </div>
  )
}
