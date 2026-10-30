import { SearchX, SlidersHorizontal } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { errorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

import { CATALOG_PAGE_SIZE, hasActiveFilters } from '../search'
import { useCatalogQuery } from '../use-catalog-query'
import { useCatalogSearch } from '../use-catalog-search'
import { CatalogFilters } from './catalog-filters'
import { CatalogPagination } from './catalog-pagination'
import { CatalogSortSelect, CatalogTabs } from './catalog-toolbar'
import { FeaturedPromo } from './featured-promo'
import { NftCard, NftCardSkeleton } from './nft-card'

export function FiltersSheet({ trigger }: { trigger: React.ReactNode }) {
  const { data } = useCatalogQuery()
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="left" className="w-[320px] overflow-y-auto border-border bg-card p-5">
        <SheetHeader className="p-0">
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>
            Filtros combináveis — os resultados atualizam na hora.
          </SheetDescription>
        </SheetHeader>
        <CatalogSortSelect className="mt-2 text-sm" />
        <CatalogFilters facets={data?.facets} className="mt-4" />
      </SheetContent>
    </Sheet>
  )
}

export function CatalogSection() {
  const { search, clear } = useCatalogSearch()
  const query = useCatalogQuery()
  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = query
  const filtered = hasActiveFilters(search)

  return (
    <section
      id="catalogo"
      aria-labelledby="catalogo-titulo"
      className="container-page scroll-mt-6 pt-4 md:pt-24"
    >
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>
      {/* minmax(0,1fr): grid items default to min-width:auto, so the tab strip's intrinsic width
          used to stretch the column past narrow (< 375px) screens. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside aria-label="Filtros do catálogo" className="hidden lg:block">
          <div className="bg-card p-5">
            <CatalogFilters facets={data?.facets} />
          </div>
          <FeaturedPromo className="mt-6" />
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <CatalogTabs className="max-md:-mx-(--page-gutter) max-md:px-(--page-gutter)" />
            <div className="hidden items-center gap-3 md:flex">
              <CatalogSortSelect className="hidden md:flex" />
              <FiltersSheet
                trigger={
                  <Button variant="outline" size="sm" className="hidden md:inline-flex lg:hidden">
                    <SlidersHorizontal aria-hidden="true" /> Filtros
                  </Button>
                }
              />
            </div>
          </div>

          {/* Result count announced politely when filters change. */}
          <p className="sr-only" role="status" aria-live="polite">
            {data && !isPlaceholderData ? `${data.total} NFTs encontrados` : ''}
          </p>

          <div className="mt-4 md:mt-8" aria-busy={isFetching}>
            {isPending ? (
              <CatalogGridSkeleton />
            ) : isError ? (
              <ErrorState
                title="Não foi possível carregar o catálogo"
                description={errorMessage(error)}
                onRetry={() => void refetch()}
                retrying={isFetching}
              />
            ) : data.items.length === 0 ? (
              <EmptyState
                icon={<SearchX />}
                title="Nenhum NFT encontrado"
                description={
                  filtered
                    ? 'Tente remover alguns filtros ou buscar outro termo.'
                    : 'O catálogo está vazio no momento.'
                }
                action={filtered ? <Button onClick={clear}>Limpar filtros</Button> : undefined}
              />
            ) : (
              <>
                <ul
                  className={cn(
                    'grid grid-cols-2 gap-x-3 gap-y-4 transition-opacity sm:grid-cols-3 md:gap-x-[34px] md:gap-y-[72px]',
                    isPlaceholderData && 'opacity-60',
                  )}
                >
                  {data.items.map((nft, index) => (
                    <li key={nft.id} className={cn(index % 2 === 1 && 'max-sm:mt-8')}>
                      <NftCard nft={nft} priority={index < 3} />
                    </li>
                  ))}
                </ul>
                <div className="mt-12 md:mt-[88px]">
                  <CatalogPagination page={data.page} totalPages={data.totalPages} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function CatalogGridSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFTs">
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:gap-x-[34px] md:gap-y-[72px]">
        {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
          <div key={index} className={cn(index % 2 === 1 && 'max-sm:mt-8')}>
            <NftCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  )
}
