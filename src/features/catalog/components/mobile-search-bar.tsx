import { Search, Settings2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { useCatalogSearch } from '../use-catalog-search'
import { FiltersSheet } from './catalog-section'

/**
 * Mobile search ("Explorar coleções") + filter button. Typing is debounced (300 ms) and written
 * to the URL with `replace`, so the history isn't flooded with one entry per keystroke.
 */
export function MobileSearchBar() {
  const { search, update } = useCatalogSearch()
  const [term, setTerm] = useState(search.q ?? '')
  const inputId = useId()

  useEffect(() => setTerm(search.q ?? ''), [search.q])

  useEffect(() => {
    if ((search.q ?? '') === term.trim()) return
    const timer = setTimeout(() => update({ q: term.trim() || undefined }, { replace: true }), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react/exhaustive-deps -- debounce only on input changes
  }, [term])

  return (
    <div className="flex gap-2 px-6 pt-10 md:hidden">
      <search className="relative flex-1">
        <label htmlFor={inputId} className="sr-only">
          Explorar coleções
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-[22px] -translate-y-1/2 text-foreground"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Explorar coleções"
          maxLength={80}
          className="h-[45px] w-full rounded-[10px] bg-card pr-3 pl-[42px] text-sm leading-4 font-bold text-foreground outline-none placeholder:text-subtle-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </search>
      <FiltersSheet
        trigger={
          <button
            type="button"
            aria-label="Abrir filtros"
            className="grid size-[45px] place-items-center rounded-[14px] bg-[linear-gradient(137.05deg,rgb(210_138_76/0.45)_24.6%,var(--kurio-500)_100%)] text-primary-foreground"
          >
            <Settings2 className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
          </button>
        }
      />
    </div>
  )
}
