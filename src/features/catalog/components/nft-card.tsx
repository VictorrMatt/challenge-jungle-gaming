import { Link } from '@tanstack/react-router'

import { FavoriteHeart } from '@/components/commerce/favorite-heart'
import { ResponsiveImage } from '@/components/responsive-image'
import { Skeleton, SkeletonSurface } from '@/components/ui/skeleton'
import { useFavorites, useToggleFavorite } from '@/features/favorites/hooks'
import { cn } from '@/lib/utils'
import type { NftSummary } from '@/shared/contracts'
import { formatEth } from '@/shared/money/eth'

const CARD_SIZES = '(min-width: 1024px) 250px, (min-width: 768px) 30vw, 45vw'

/**
 * Catalog card. Desktop: framed artwork with name/price below (Figma desktop);
 * mobile: compact card with the text inside and a favorite button (Figma mobile).
 * The whole card is clickable through a stretched link on the title.
 */
export function NftCard({
  nft,
  priority = false,
  className,
}: {
  nft: NftSummary
  priority?: boolean
  className?: string
}) {
  const favorites = useFavorites()
  const toggle = useToggleFavorite()
  const isFavorite = favorites.data?.has(nft.id) ?? false

  return (
    <article
      className={cn(
        'group relative rounded-2xl bg-card p-1 pb-3 transition-transform duration-300 ease-out md:rounded-none md:bg-transparent md:p-0 md:hover:-translate-y-1',
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-xl transition-shadow duration-300 md:flex md:aspect-[258/300] md:items-center md:justify-center md:rounded-none md:bg-card md:px-1 md:group-hover:shadow-[0_18px_40px_-20px_rgba(232,155,85,0.45)]">
        <div className="aspect-square w-full overflow-hidden rounded-xl md:rounded-2xl">
          <ResponsiveImage
            src={nft.image}
            alt={nft.imageAlt}
            sizes={CARD_SIZES}
            width={250}
            height={250}
            priority={priority}
            className={cn(
              'size-full transition-transform duration-300 group-hover:scale-[1.03]',
              nft.soldOut && 'opacity-60 grayscale-[40%]',
            )}
          />
        </div>
        {nft.rarity !== 'common' && (
          <span className="absolute top-0 left-0 bg-primary px-3 py-0.5 text-sm font-bold text-primary-foreground uppercase md:h-[26px] md:w-[78px] md:px-[14px] md:py-0 md:text-base md:leading-[26px]">
            {nft.rarity === 'legendary' ? 'Lendário' : 'Raro'}
          </span>
        )}
        {nft.soldOut && (
          <span className="absolute right-2 bottom-2 rounded-sm bg-background/90 px-2 py-0.5 text-xs font-bold text-foreground">
            Esgotado
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => toggle.toggle(nft.id, nft.name, !isFavorite)}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite ? `Remover ${nft.name} da lista de interesse` : `Favoritar ${nft.name}`
        }
        className={cn(
          'absolute top-3 right-3 z-10 grid size-7 place-items-center rounded-full bg-background/80 text-highlight transition-opacity',
          'md:top-2 md:right-2 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100',
          isFavorite && 'md:opacity-100',
        )}
      >
        <FavoriteHeart active={isFavorite} className="size-4" />
      </button>

      <div className="px-2 pt-2 md:px-0 md:pt-5">
        <h3 className="truncate text-[15px] leading-[1.4] text-foreground min-[400px]:text-base">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="text-lg leading-[1.4] font-bold text-highlight">
          <span className="sr-only">Preço: </span>
          {formatEth(nft.price)}
          {nft.compareAtPrice && (
            <span className="ml-3 font-normal text-subtle-foreground">
              <span className="sr-only">, antes </span>
              {formatEth(nft.compareAtPrice)}
            </span>
          )}
        </p>
      </div>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div aria-hidden="true" className="relative">
      {/* Mobile: one card surface with the art and the text inside (same box as NftCard). */}
      <SkeletonSurface className="rounded-2xl p-1 pb-3 md:hidden">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="px-2 pt-2">
          <Skeleton className="my-[3px] h-4 w-3/4 rounded-sm" />
          <Skeleton className="mt-2 h-5 w-1/2 rounded-sm" />
        </div>
      </SkeletonSurface>
      {/* Desktop: framed artwork (258×300 frame, square art inset) with name/price below. */}
      <div className="hidden md:block">
        <SkeletonSurface className="flex aspect-[258/300] items-center px-1">
          <Skeleton className="aspect-square w-full rounded-2xl" />
        </SkeletonSurface>
        <div className="pt-5">
          <Skeleton className="my-[3px] h-4 w-2/3 rounded-sm" />
          <Skeleton className="mt-2.5 h-5 w-2/5 rounded-sm" />
        </div>
      </div>
    </div>
  )
}
