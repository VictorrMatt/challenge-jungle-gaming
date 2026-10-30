import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { ResponsiveImage } from '@/components/responsive-image'
import { ON_CARD_SKELETON, Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { featuredQueryOptions } from '../queries'

/** "NFT EM DESTAQUE / OFERTA LIMITADA" card below the filters (desktop). */
export function FeaturedPromo({ className }: { className?: string }) {
  const { data } = useQuery(featuredQueryOptions())
  const nft = data?.items[1] ?? data?.items[0]

  return (
    <section
      aria-labelledby="destaque-titulo"
      className={cn('bg-gradient-to-b from-surface-strong/60 to-transparent', className)}
    >
      <h2
        id="destaque-titulo"
        className="px-5 pt-6 text-2xl leading-[1.4] font-bold text-highlight uppercase"
      >
        NFT em destaque
      </h2>
      <p className="mt-1 text-center text-xl leading-[1.4] font-bold text-foreground uppercase">
        Oferta limitada
      </p>
      <div className="mt-2.5 aspect-[310/366] overflow-hidden rounded-[20px]">
        {nft ? (
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="block size-full"
            aria-label={`Ver ${nft.name}`}
          >
            <ResponsiveImage
              src={nft.image}
              alt={nft.imageAlt}
              sizes="310px"
              width={310}
              height={366}
              className="size-full"
            />
          </Link>
        ) : (
          <Skeleton className={cn('size-full rounded-[20px]', ON_CARD_SKELETON)} />
        )}
      </div>
    </section>
  )
}
