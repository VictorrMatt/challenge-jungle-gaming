import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect, useRef, useState } from 'react'

import { smooth } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { catalogSort, catalogTab } from '@/shared/contracts'

import { SORT_LABELS, TAB_LABELS } from '../search'
import { useCatalogSearch } from '../use-catalog-search'

export function CatalogTabs({ className }: { className?: string }) {
  const { search, update } = useCatalogSearch()
  const current = search.tab ?? 'all'
  const ref = useRef<HTMLElement>(null)
  // Which edges have hidden tabs behind them (drives the fade masks on narrow screens).
  const [edges, setEdges] = useState({ start: false, end: false })

  useEffect(() => {
    const nav = ref.current
    if (!nav) return
    const measure = () => {
      const max = nav.scrollWidth - nav.clientWidth
      setEdges({ start: nav.scrollLeft > 1, end: nav.scrollLeft < max - 1 })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    nav.addEventListener('scroll', measure, { passive: true })
    return () => {
      observer.disconnect()
      nav.removeEventListener('scroll', measure)
    }
  }, [])

  const mask =
    edges.start && edges.end
      ? 'linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)'
      : edges.end
        ? 'linear-gradient(to right, black calc(100% - 40px), transparent)'
        : edges.start
          ? 'linear-gradient(to right, transparent, black 40px)'
          : undefined

  return (
    <nav
      ref={ref}
      aria-label="Filtrar por destaque"
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      className={cn(
        'flex max-w-full min-w-0 snap-x [scrollbar-width:none] gap-4 overflow-x-auto overscroll-x-contain md:gap-5 [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {catalogTab.options.map((tab) => {
        const active = tab === current
        return (
          <button
            key={tab}
            type="button"
            aria-pressed={active}
            onClick={(event) => {
              update({ tab: tab === 'all' ? undefined : tab })
              // Bring a partly hidden tab fully into the strip (horizontal only, page stays put).
              const nav = ref.current
              const button = event.currentTarget
              if (!nav) return
              const left = button.offsetLeft - nav.offsetLeft
              const target = Math.min(
                Math.max(left - (nav.clientWidth - button.offsetWidth) / 2, 0),
                nav.scrollWidth - nav.clientWidth,
              )
              nav.scrollTo({ left: target, behavior: smooth() })
            }}
            className={cn(
              'relative shrink-0 snap-start scroll-mx-(--page-gutter) pb-1 text-sm leading-4 whitespace-nowrap transition-colors md:pb-[7px] md:text-[15px] md:font-medium',
              active ? 'max-md:font-bold' : 'max-md:font-normal',
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
    <div className={cn('flex items-center gap-1 text-[15px]', className)}>
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
          className="!h-[22px] gap-1 border-0 bg-transparent p-0 text-[15px] text-foreground shadow-none focus-visible:ring-2 dark:bg-transparent dark:hover:bg-transparent"
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
