import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

import { useCatalogSearch } from '../use-catalog-search'

function pagesToShow(current: number, total: number) {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  const start = Math.max(1, Math.min(current - 1, total - 3))
  return Array.from({ length: 4 }, (_, index) => start + index)
}

const itemClass =
  'grid size-[35px] place-items-center rounded-sm border border-input text-lg leading-none text-foreground transition-colors hover:border-primary disabled:pointer-events-none disabled:opacity-40'

export function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { update } = useCatalogSearch()
  if (totalPages <= 1) return null

  const go = (target: number) => {
    update({ page: target === 1 ? undefined : target })
    document.getElementById('catalogo')?.scrollIntoView({ block: 'start' })
  }

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex gap-2">
        {page > 1 && (
          <li>
            <button
              type="button"
              className={itemClass}
              onClick={() => go(page - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
          </li>
        )}
        {pagesToShow(page, totalPages).map((target) => (
          <li key={target}>
            <button
              type="button"
              onClick={() => go(target)}
              aria-label={`Página ${target}`}
              aria-current={target === page ? 'page' : undefined}
              className={cn(
                itemClass,
                target === page && 'border-primary bg-primary font-bold text-primary-foreground',
              )}
            >
              {target}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className={itemClass}
            onClick={() => go(page + 1)}
            disabled={page >= totalPages}
            aria-label="Próxima página"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  )
}
