import { useQueries } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { nftDetailQueryOptions } from '@/features/catalog/queries'
import { useFavorites } from '@/features/favorites/hooks'
import { errorMessage } from '@/lib/api/errors'

export const Route = createFileRoute('/_private/favoritos')({
  head: () => ({ meta: [{ title: 'Lista de interesse — Kurio' }] }),
  component: FavoritesPage,
})

/** The authenticated collector's favorites (persisted server-side per user). */
function FavoritesPage() {
  const favorites = useFavorites()
  const ids = [...(favorites.data ?? [])]
  const details = useQueries({ queries: ids.map((id) => nftDetailQueryOptions(id)) })

  return (
    <div className="container-page pt-8">
      <h1 className="text-[28px] font-bold text-foreground">Lista de interesse</h1>
      <p className="mt-1 text-muted-foreground">
        NFTs que você favoritou ficam salvos na sua conta.
      </p>
      <div className="mt-8">
        {favorites.isError ? (
          <ErrorState
            description={errorMessage(favorites.error)}
            onRetry={() => void favorites.refetch()}
            retrying={favorites.isFetching}
          />
        ) : favorites.isPending ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-8 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index}>
                <NftCardSkeleton />
              </li>
            ))}
          </ul>
        ) : ids.length === 0 ? (
          <EmptyState
            icon={<Heart />}
            title="Sua lista está vazia"
            description="Toque no coração de um NFT para guardá-lo aqui."
            action={
              <Button asChild>
                <Link to="/" hash="catalogo">
                  Explorar o mercado
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-8 lg:grid-cols-4">
            {details.map((query, index) => (
              <li key={ids[index]}>
                {query.data ? <NftCard nft={query.data} /> : <NftCardSkeleton />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
