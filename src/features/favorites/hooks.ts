import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'

import { useCurrentUser } from '@/features/auth/session-store'
import { api } from '@/lib/api/endpoints'
import { errorMessage } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/keys'
import type { FavoritesResponse } from '@/shared/contracts'

export function useFavorites() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: queryKeys.user.favorites(user?.id ?? 'anonymous'),
    queryFn: ({ signal }) => api.favorites.list(signal),
    enabled: Boolean(user),
    select: (data) => new Set(data.nftIds),
  })
}

/**
 * Optimistic favorite toggle:
 * 1. cancel in-flight reads and snapshot the cache;
 * 2. flip the heart immediately;
 * 3. on failure, restore the snapshot and tell the collector (toast = live region);
 * 4. always reconcile with the server afterwards.
 */
export function useToggleFavorite() {
  const user = useCurrentUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })
  const key = queryKeys.user.favorites(user?.id ?? 'anonymous')

  const mutation = useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean; name: string }) =>
      favorite ? api.favorites.add(nftId) : api.favorites.remove(nftId),
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (current) => {
        const ids = new Set(current?.nftIds ?? [])
        if (favorite) ids.add(nftId)
        else ids.delete(nftId)
        return { nftIds: [...ids] }
      })
      return { previous }
    },
    onError: (error, { favorite, name }, context) => {
      queryClient.setQueryData(key, context?.previous)
      toast.error(
        `${favorite ? 'Não foi possível favoritar' : 'Não foi possível remover'} ${name}. ${errorMessage(error, '')}`.trim(),
      )
    },
    onSuccess: (data, { favorite, name }) => {
      queryClient.setQueryData(key, data)
      toast.success(
        favorite
          ? `${name} adicionado à lista de interesse.`
          : `${name} removido da lista de interesse.`,
        {
          id: 'favorite-feedback',
        },
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  return {
    isPending: mutation.isPending,
    toggle(nftId: string, name: string, favorite: boolean) {
      if (!user) {
        toast.info('Entre para salvar NFTs na sua lista de interesse.', { id: 'favorite-auth' })
        void navigate({ to: '/entrar', search: { redirect: href } })
        return
      }
      mutation.mutate({ nftId, favorite, name })
    },
  }
}
