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
      <div aria-hidden="true" className="px-7 pt-[23px] pb-[84px] md:hidden">
        <div className="flex justify-between">
          <Skeleton className="size-[35px] rounded-full" />
          <Skeleton className="size-[35px] rounded-full" />
        </div>
        <Skeleton className="mt-2 aspect-[361/356] rounded-[24px]" />
      </div>

      <div
        aria-hidden="true"
        className={cn(
          'container-page max-md:relative max-md:-mt-[114px] max-md:rounded-t-[31px] max-md:bg-card max-md:pt-8 max-md:pb-[188px] md:pt-8',
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
      <SkeletonSurface className="fixed inset-x-0 bottom-0 z-30 rounded-t-[40px] px-6 pt-5 pb-[max(36px,env(safe-area-inset-bottom))] shadow-[0_0_10px_rgba(10,6,4,0.45)] md:hidden">
        <div className="flex items-center justify-between">
          <Skeleton className="h-[30px] w-32 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-sm" />
        </div>
        <div className="mt-5 flex gap-3">
          <Skeleton className="h-[60px] w-[196px] rounded-[40px]" />
          <Skeleton className="size-[60px] rounded-full" />
        </div>
      </SkeletonSurface>
    </div>
  )
}
