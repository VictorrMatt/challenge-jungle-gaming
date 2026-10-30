import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { catalogSort, catalogTab } from '@/shared/contracts'

import { SORT_LABELS, TAB_LABELS } from '../search'
import { useCatalogSearch } from '../use-catalog-search'

export function CatalogTabs({ className }: { className?: string }) {
  const { search, update } = useCatalogSearch()
  const current = search.tab ?? 'all'
  return (
    <nav
      aria-label="Filtrar por destaque"
      className={cn('flex gap-4 overflow-x-auto md:gap-[21px]', className)}
    >
      {catalogTab.options.map((tab) => {
        const active = tab === current
        return (
          <button
            key={tab}
            type="button"
            aria-pressed={active}
            onClick={() => update({ tab: tab === 'all' ? undefined : tab })}
            className={cn(
              'relative shrink-0 pb-1 text-sm leading-[1.4] font-bold whitespace-nowrap transition-colors md:text-base',
              active
                ? 'text-highlight after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-primary'
                : 'text-foreground hover:text-highlight',
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        )
      })}
    </nav>
  )
}

export function CatalogSortSelect({ className }: { className?: string }) {
  const { search, update } = useCatalogSearch()
  return (
    <div className={cn('flex items-center gap-1 text-base', className)}>
      <span id="sort-label" className="text-foreground">
        Ordenar por:
      </span>
      <Select
        value={search.sort ?? 'recent'}
        onValueChange={(value) =>
          update({ sort: value === 'recent' ? undefined : (value as typeof search.sort) })
        }
      >
        <SelectTrigger
          aria-labelledby="sort-label"
          className="!h-[22px] gap-1 border-0 bg-transparent p-0 text-base text-foreground shadow-none focus-visible:ring-2 dark:bg-transparent dark:hover:bg-transparent"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {catalogSort.options.map((sort) => (
            <SelectItem key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
