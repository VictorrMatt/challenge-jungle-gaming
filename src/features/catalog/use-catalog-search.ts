import { getRouteApi } from '@tanstack/react-router'

import type { CatalogSearch } from './search'

const homeRoute = getRouteApi('/')

/**
 * Reads/writes the catalog state in the URL. Any change other than `page` resets pagination
 * (a new filter must start from page 1). Navigations push history entries, so back/forward
 * restore previous filter states.
 */
export function useCatalogSearch() {
  const search = homeRoute.useSearch()
  const navigate = homeRoute.useNavigate()

  function update(patch: Partial<CatalogSearch>, { replace = false } = {}) {
    void navigate({
      search: (previous) => {
        const next = { ...previous, ...patch }
        if (!('page' in patch)) next.page = undefined
        return next
      },
      replace,
      resetScroll: false,
    })
  }

  function clear() {
    void navigate({
      search: (previous) => ({ tab: previous.tab, sort: previous.sort }),
      resetScroll: false,
    })
  }

  return { search, update, clear }
}
