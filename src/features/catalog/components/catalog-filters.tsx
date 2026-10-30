import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import type { CatalogFacets, CategoryId, NetworkId } from '@/shared/contracts'

import type { CatalogSearch } from '../search'
import { useCatalogSearch } from '../use-catalog-search'

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Slider positions are UI-only numbers; they are converted back to 2-decimal strings for the API. */
function toBound(value: number) {
  return value.toFixed(2)
}

function toggle<T>(list: T[] | undefined, value: T) {
  const set = new Set(list ?? [])
  if (set.has(value)) set.delete(value)
  else set.add(value)
  return set.size ? [...set] : undefined
}

function FacetList<T extends string>({
  title,
  items,
  selected,
  onToggle,
  dense = false,
}: {
  title: string
  items: Array<{ id: T; label: string; count: number }>
  selected: T[] | undefined
  onToggle: (id: T) => void
  dense?: boolean
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-lg leading-[1.4] font-bold text-foreground">
        {title}
      </h2>
      <ul className="mt-[13px]">
        {items.map((item) => {
          const active = selected?.includes(item.id) ?? false
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(item.id)}
                className={cn(
                  'flex h-10 w-full items-center justify-between rounded-sm pr-3 pl-3 text-left leading-[1.4] transition-colors hover:text-highlight',
                  dense ? 'text-[15px]' : 'text-base',
                  active ? 'font-bold text-highlight' : 'text-muted-foreground',
                )}
              >
                <span>{item.label}</span>
                <span aria-label={`${item.count} itens`}>({item.count})</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function PriceRange({
  facets,
  search,
  onApply,
}: {
  facets: CatalogFacets
  search: CatalogSearch
  onApply: (min?: string, max?: string) => void
}) {
  const headingId = useId()
  const floor = Number(facets.priceRange.min)
  const ceil = Number(facets.priceRange.max)
  const initial: [number, number] = [
    Number(search.minPrice ?? floor),
    Number(search.maxPrice ?? ceil),
  ]
  // The parent remounts this component (key) when the URL bounds change, re-seeding the state.
  const [range, setRange] = useState<[number, number]>(initial)

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-lg leading-[1.4] font-bold text-foreground">
        Faixa de preço
      </h2>
      <Slider
        className="mt-4 px-3"
        min={floor}
        max={ceil}
        step={0.01}
        minStepsBetweenThumbs={1}
        value={range}
        onValueChange={(value) => setRange([value[0] ?? floor, value[1] ?? ceil])}
        aria-label="Faixa de preço"
        thumbLabels={['Preço mínimo', 'Preço máximo']}
      />
      <p className="mt-4 px-3 text-sm text-foreground" aria-live="polite">
        Preço: {priceFormatter.format(range[0])} - {priceFormatter.format(range[1])} ETH
      </p>
      <Button
        size="sm"
        className="mt-3 ml-3 h-9 px-3 text-base"
        onClick={() =>
          onApply(
            range[0] > floor ? toBound(range[0]) : undefined,
            range[1] < ceil ? toBound(range[1]) : undefined,
          )
        }
      >
        Aplicar
      </Button>
    </section>
  )
}

export function CatalogFilters({
  facets,
  className,
}: {
  facets: CatalogFacets | undefined
  className?: string
}) {
  const { search, update } = useCatalogSearch()

  if (!facets) {
    return (
      <div className={cn('space-y-3', className)} aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-7 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-[34px]', className)}>
      <FacetList<CategoryId>
        title="Coleções"
        items={facets.categories}
        selected={search.categories}
        onToggle={(id) => update({ categories: toggle(search.categories, id) })}
      />
      <PriceRange
        key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}-${facets.priceRange.min}-${facets.priceRange.max}`}
        facets={facets}
        search={search}
        onApply={(minPrice, maxPrice) => update({ minPrice, maxPrice })}
      />
      <FacetList<NetworkId>
        title="Rede"
        dense
        items={facets.networks}
        selected={search.networks}
        onToggle={(id) => update({ networks: toggle(search.networks, id) })}
      />
    </div>
  )
}
