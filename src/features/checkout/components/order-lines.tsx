import { ResponsiveImage } from '@/components/responsive-image'
import { cn } from '@/lib/utils'
import type { QuoteLine } from '@/shared/contracts'
import { formatEth } from '@/shared/money/eth'

type Line = Pick<QuoteLine, 'name' | 'tokenId' | 'image' | 'quantity' | 'lineTotal'> & {
  id: string
}

/** "Seus NFTs" / receipt lines: thumbnail, name, token id, (x qty) and subtotal. */
export function OrderLines({
  lines,
  className,
  compact = false,
}: {
  lines: Line[]
  className?: string
  compact?: boolean
}) {
  return (
    <ul className={cn('space-y-3', className)}>
      {lines.map((line) => (
        <li
          key={line.id}
          className={cn(
            'grid grid-cols-[70px_1fr_auto_auto] items-center gap-3 pr-4',
            !compact && 'h-[70px] bg-card',
          )}
        >
          <ResponsiveImage
            src={line.image}
            alt=""
            sizes="70px"
            width={70}
            height={70}
            className="size-[70px] rounded-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">{line.name}</p>
            <p className="truncate text-sm text-muted-foreground">ID do token: {line.tokenId}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            <span aria-hidden="true">(x {line.quantity})</span>
            <span className="sr-only">{line.quantity} edições</span>
          </p>
          <p className="text-lg font-bold whitespace-nowrap text-highlight">
            {formatEth(line.lineTotal)}
          </p>
        </li>
      ))}
    </ul>
  )
}
