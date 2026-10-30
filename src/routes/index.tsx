import { createFileRoute } from '@tanstack/react-router'

import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { HomeJournal, HomePromos } from '@/features/catalog/components/home-editorial'
import { MobileSearchBar } from '@/features/catalog/components/mobile-search-bar'
import { catalogQueryOptions, featuredQueryOptions } from '@/features/catalog/queries'
import { catalogSearchSchema, toCatalogQuery } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => toCatalogQuery(search),
  // Start fetching as early as possible but never block the page: skeletons cover loading.
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(catalogQueryOptions(deps))
    void queryClient.prefetchQuery(featuredQueryOptions())
  },
  head: () => ({
    meta: [{ title: 'Kurio — Marketplace de NFTs e arte digital' }],
  }),
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <MobileSearchBar />
      <HomeHero />
      <CatalogSection />
      <HomePromos />
      <HomeJournal />
    </>
  )
}
