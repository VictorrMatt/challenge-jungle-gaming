import { Skeleton, SkeletonSurface } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function Lines({ widths, className }: { widths: string[]; className?: string }) {
  return (
    <div className={className}>
      {widths.map((width, index) => (
        <Skeleton key={index} className={`mt-2.5 h-3.5 rounded-sm first:mt-0 ${width}`} />
      ))}
    </div>
  )
}

/**
 * Mirrors the detail page box-for-box (mobile hero + sheet + buy bar, desktop gallery +
 * info column) so the real content replaces it without shifting.
 */
export function NftDetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFT">
      {/* ------------------------------------------------------------ Mobile hero */}
      <div aria-hidden="true" className="relative md:hidden">
        <div className="absolute inset-x-0 top-0 flex justify-between px-6 pt-5">
          <Skeleton className="size-[34px] rounded-full" />
          <Skeleton className="size-[34px] rounded-full" />
        </div>
        <div className="px-7 pt-16">
          <Skeleton className="aspect-[361/330] rounded-[24px]" />
        </div>
      </div>

      <div
        aria-hidden="true"
        className={cn(
          'container-page max-md:-mt-6 max-md:rounded-t-[28px] max-md:bg-card max-md:pt-6 max-md:pb-48 md:pt-6',
          'max-md:[--shimmer-base:var(--kurio-850)]',
        )}
      >
        <div className="hidden items-center gap-2 md:flex">
          <Skeleton className="h-4 w-14 rounded-sm" />
          <Skeleton className="h-4 w-16 rounded-sm" />
        </div>

        <div className="grid gap-8 md:mt-3 lg:grid-cols-[572px_1fr] lg:gap-[33px]">
          <div className="hidden gap-7 lg:grid lg:grid-cols-[100px_444px]">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="size-[100px] rounded-sm" />
              ))}
            </div>
            <Skeleton className="size-[444px] rounded-sm" />
          </div>
          <Skeleton className="hidden aspect-square w-full rounded-[20px] md:block lg:hidden" />

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 md:block">
              <Skeleton className="h-6 w-1/2 rounded-sm md:h-8 md:w-3/4" />
              <Skeleton className="h-6 w-16 rounded-full md:hidden" />
            </div>
            <div className="mt-3 hidden items-center justify-between border-b border-border-accent pb-3 md:flex">
              <Skeleton className="h-6 w-32 rounded-sm" />
              <Skeleton className="h-4 w-28 rounded-sm" />
            </div>
            <Skeleton className="mt-5 hidden h-3.5 w-32 rounded-sm md:block" />
            <Lines widths={['w-full', 'w-full', 'w-4/5']} className="mt-4 md:mt-3" />
            <div className="mt-5 flex gap-2">
              {['w-20', 'w-24', 'w-[72px]'].map((width) => (
                <Skeleton key={width} className={`h-[30px] rounded-full ${width}`} />
              ))}
            </div>
            <div className="mt-6 hidden items-center justify-between md:flex">
              <Skeleton className="h-[46px] w-[150px] rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-[46px] w-[130px] rounded-md" />
                <Skeleton className="h-[46px] w-[130px] rounded-md" />
              </div>
            </div>
            <Lines widths={['w-40', 'w-56', 'w-64']} className="mt-6 [&>*]:mt-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ Mobile buy bar */}
      <SkeletonSurface className="fixed inset-x-0 bottom-0 z-30 rounded-t-[28px] bg-[#1d120e] px-6 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.4)] md:hidden">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-sm" />
        </div>
        <Skeleton className="mt-4 h-[52px] w-full rounded-full" />
      </SkeletonSurface>
    </div>
  )
}
