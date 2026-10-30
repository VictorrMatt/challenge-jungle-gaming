import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { sessionStore, useCurrentUser } from '@/features/auth/session-store'
import { api } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/keys'
import type {
  ChangePasswordRequest,
  Profile,
  UpdateProfileRequest,
  WalletInput,
  WalletSlot,
  WalletsResponse,
} from '@/shared/contracts'

function useUserId() {
  const user = useCurrentUser()
  return user?.id ?? 'anonymous'
}

export function useProfile() {
  const userId = useUserId()
  return useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: ({ signal }) => api.profile.get(signal),
    enabled: userId !== 'anonymous',
  })
}

export function useWallets() {
  const userId = useUserId()
  return useQuery({
    queryKey: queryKeys.user.wallets(userId),
    queryFn: ({ signal }) => api.wallets.list(signal),
    enabled: userId !== 'anonymous',
  })
}

/** Keeps the header/session user in sync after profile or avatar changes. */
function syncSessionUser(profile: Profile) {
  const state = sessionStore.getState()
  if (state.status !== 'authenticated') return
  sessionStore.updateUser({
    ...state.session.user,
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
  })
}

export function useUpdateProfile() {
  const userId = useUserId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => api.profile.update(body),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.user.profile(userId), profile)
      syncSessionUser(profile)
    },
  })
}

export function useAvatar() {
  const userId = useUserId()
  const queryClient = useQueryClient()
  const onSuccess = (profile: Profile) => {
    queryClient.setQueryData(queryKeys.user.profile(userId), profile)
    syncSessionUser(profile)
  }
  return {
    upload: useMutation({
      mutationFn: (dataUrl: string) => api.profile.setAvatar(dataUrl),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: () => api.profile.removeAvatar(), onSuccess }),
  }
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => api.profile.changePassword(body),
  })
}

export function useSaveWallet() {
  const userId = useUserId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slot, body }: { slot: WalletSlot; body: WalletInput }) =>
      api.wallets.save(slot, body),
    onSuccess: (wallet) => {
      queryClient.setQueryData<WalletsResponse>(queryKeys.user.wallets(userId), (current) => ({
        primary: current?.primary ?? null,
        secondary: current?.secondary ?? null,
        [wallet.slot]: wallet,
      }))
    },
  })
}
