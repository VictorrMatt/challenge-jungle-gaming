import { Skeleton } from '@/components/ui/skeleton'

/** Mirrors the detail layout box-for-box so the real content replaces it without shifting. */
export function NftDetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFT" className="container-page pt-6">
      <Skeleton className="hidden h-[22px] w-40 md:block" />
      <div className="mt-2 grid gap-8 lg:grid-cols-[572px_1fr] lg:gap-[33px]">
        <div className="grid gap-7 lg:grid-cols-[100px_444px]">
          <div className="hidden flex-col gap-4 lg:flex">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="size-[100px] rounded-sm" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full rounded-sm lg:size-[444px]" />
        </div>
        <div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="mt-2 h-8 w-1/3" />
          <Skeleton className="mt-6 h-5 w-40" />
          <Skeleton className="mt-3 h-[72px] w-full" />
          <Skeleton className="mt-6 h-[26px] w-64 rounded-full" />
          <Skeleton className="mt-6 h-[46px] w-full" />
          <Skeleton className="mt-6 h-24 w-2/3" />
        </div>
      </div>
    </div>
  )
}
