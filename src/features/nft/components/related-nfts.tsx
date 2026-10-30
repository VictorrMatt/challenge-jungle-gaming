import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { ResponsiveImage } from '@/components/responsive-image'
import { Skeleton, SkeletonSurface } from '@/components/ui/skeleton'
import { relatedQueryOptions } from '@/features/catalog/queries'
import type { NftSummary } from '@/shared/contracts'
import { formatEth } from '@/shared/money/eth'

export function MiniNftCard({ nft }: { nft: NftSummary }) {
  return (
    <article className="group relative">
      {/* Figma: 219×255 card frame, 4px side inset, artwork top-aligned with 13px corners. */}
      <div className="aspect-[219/255] bg-card px-1 pt-4">
        <div className="aspect-square w-full overflow-hidden rounded-[13px]">
          <ResponsiveImage
            src={nft.image}
            alt={nft.imageAlt}
            sizes="(min-width: 768px) 200px, 45vw"
            width={200}
            height={200}
            className="size-full transition-transform group-hover:scale-[1.03]"
          />
        </div>
      </div>
      <h3 className="mt-3 truncate text-[15px] leading-[normal] text-foreground">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {nft.name}
        </Link>
      </h3>
      <p className="text-base leading-4 font-bold text-highlight">{formatEth(nft.price)}</p>
    </article>
  )
}

/** "Mais desta coleção" / "Colecionadores também viram": scroll-snapping strip. */
export function RelatedNfts({ nftId, title }: { nftId: string; title: string }) {
  const { data, isPending } = useQuery(relatedQueryOptions(nftId))

  return (
    <section aria-labelledby={`related-${nftId}`} className="mt-20 md:mt-24">
      <h2
        id={`related-${nftId}`}
        className="border-b border-border-accent pb-3 text-[17px] leading-4 font-bold text-highlight"
      >
        {title}
      </h2>
      <ul className="mt-8 grid snap-x snap-mandatory auto-cols-[minmax(160px,45%)] grid-flow-col gap-[26px] overflow-x-auto pb-2 md:auto-cols-[minmax(180px,1fr)]">
        {isPending
          ? Array.from({ length: 5 }, (_, index) => (
              <li key={index} aria-hidden="true">
                <SkeletonSurface className="aspect-[219/255] px-1 pt-4">
                  <Skeleton className="aspect-square w-full rounded-[13px]" />
                </SkeletonSurface>
                <Skeleton className="mt-4 h-4 w-3/4 rounded-sm" />
                <Skeleton className="mt-2 h-4 w-1/3 rounded-sm" />
              </li>
            ))
          : data?.items.map((nft) => (
              <li key={nft.id} className="snap-start">
                <MiniNftCard nft={nft} />
              </li>
            ))}
      </ul>
    </section>
  )
}
