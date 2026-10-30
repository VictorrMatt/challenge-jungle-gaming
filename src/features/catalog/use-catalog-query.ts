import { useQuery } from '@tanstack/react-query'

import { catalogQueryOptions } from './queries'
import { toCatalogQuery } from './search'
import { useCatalogSearch } from './use-catalog-search'

export function useCatalogQuery() {
  const { search } = useCatalogSearch()
  return useQuery(catalogQueryOptions(toCatalogQuery(search)))
}
