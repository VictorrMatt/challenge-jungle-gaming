import { ChevronDown } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ErrorState } from '@/components/feedback/error-state'
import { applyFieldErrors } from '@/components/form/field-errors'
import { FormField, PasswordField } from '@/components/form/form-field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarField } from '@/features/account/components/avatar-field'
import { useChangePassword, useProfile, useUpdateProfile } from '@/features/account/hooks'
import { errorMessage, isApiClientError } from '@/lib/api/errors'
import {
  changePasswordRequest,
  updateProfileRequest,
  type ChangePasswordRequest,
  type Profile,
  type UpdateProfileRequest,
} from '@/shared/contracts'

export const Route = createFileRoute('/_private/perfil/')({
  head: () => ({ meta: [{ title: 'Meu perfil — Kurio' }] }),
  component: ProfilePage,
})

function ProfilePage() {
  const { data: profile, isPending, isError, error, refetch, isFetching } = useProfile()
  if (isError)
    return (
      <ErrorState
        description={errorMessage(error)}
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    )
  if (isPending) {
    return (
      <div role="status" aria-label="Carregando perfil" className="grid gap-7 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[69px]" />
        ))}
      </div>
    )
  }
  return <ProfileForms profile={profile} />
}

const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const

/**
 * One "Salvar" (as in Figma) submits the profile and, when any password field is filled,
 * the password change too. Each part validates and reports errors independently.
 */
function ProfileForms({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const profileForm = useForm<UpdateProfileRequest>({
    resolver: zodResolver(updateProfileRequest),
    defaultValues: {
      displayName: profile.displayName,
      username: profile.username,
      email: profile.email,
      ensName: profile.ensName,
      walletNickname: profile.walletNickname,
    },
  })
  const passwordForm = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordRequest),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  // Read during render so react-hook-form subscribes to these formState fields.
  const { errors: pErrors, isDirty: profileIsDirty } = profileForm.formState
  const wErrors = passwordForm.formState.errors
  const saving = updateProfile.isPending || changePassword.isPending

  async function save(event: React.FormEvent) {
    event.preventDefault()
    const wantsPassword = PASSWORD_FIELDS.some((field) => passwordForm.getValues(field))
    const profileOk = await profileForm.trigger()
    const passwordOk = wantsPassword ? await passwordForm.trigger() : true
    if (!profileOk || !passwordOk) {
      toast.error('Revise os campos destacados.')
      return
    }

    const profileDirty = profileIsDirty
    if (profileDirty) {
      try {
        const saved = await updateProfile.mutateAsync(profileForm.getValues())
        // New baseline: the saved values are no longer "dirty" (avatar uploads don't reset edits).
        profileForm.reset({
          displayName: saved.displayName,
          username: saved.username,
          email: saved.email,
          ensName: saved.ensName,
          walletNickname: saved.walletNickname,
        })
        toast.success('Perfil atualizado.')
      } catch (error) {
        if (!(
          isApiClientError(error) &&
          applyFieldErrors(error.fieldErrors, profileForm.setError, [
            'displayName',
            'username',
            'email',
            'ensName',
            'walletNickname',
          ] as const)
        )) {
          toast.error(errorMessage(error))
        }
        return
      }
    }
    if (wantsPassword) {
      try {
        await changePassword.mutateAsync(passwordForm.getValues())
        passwordForm.reset()
        toast.success('Senha alterada com sucesso.')
      } catch (error) {
        if (!(
          isApiClientError(error) &&
          applyFieldErrors(error.fieldErrors, passwordForm.setError, PASSWORD_FIELDS)
        )) {
          toast.error(errorMessage(error))
        }
      }
    }
    if (!profileDirty && !wantsPassword) toast.info('Nenhuma alteração para salvar.')
  }

  return (
    <form onSubmit={save} noValidate aria-labelledby="perfil-titulo" aria-busy={saving}>
      <h2 id="perfil-titulo" className="text-base font-bold text-foreground">
        Perfil do colecionador
      </h2>
      <div className="mt-[34px] grid gap-x-7 gap-y-[34px] md:grid-cols-2">
        <FormField
          label="Nome de exibição"
          required
          error={pErrors.displayName?.message}
          inputClassName="rounded-none"
          {...profileForm.register('displayName')}
        />
        <FormField
          label="Nome de usuário"
          required
          autoComplete="username"
          error={pErrors.username?.message}
          inputClassName="rounded-none"
          {...profileForm.register('username')}
        />
        <FormField
          label="E-mail"
          required
          type="email"
          autoComplete="email"
          error={pErrors.email?.message}
          inputClassName="rounded-none"
          {...profileForm.register('email')}
        />
        <FormField
          label="Nome ENS"
          required
          error={pErrors.ensName?.message}
          inputClassName="rounded-none pl-[96px]"
          leading={
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 flex w-[78px] items-center justify-between border border-input px-3 text-base whitespace-nowrap text-foreground"
            >
              .eth <ChevronDown className="size-4" />
            </span>
          }
          {...profileForm.register('ensName')}
        />
        <FormField
          label="Apelido da carteira"
          required
          error={pErrors.walletNickname?.message}
          inputClassName="rounded-none"
          {...profileForm.register('walletNickname')}
        />
        <AvatarField profile={profile} />
      </div>

      <fieldset className="mt-10 max-w-[417px]">
        <legend className="text-base font-bold text-foreground">Alterar senha</legend>
        <div className="mt-5 space-y-5">
          <PasswordField
            label="Senha atual"
            autoComplete="current-password"
            error={wErrors.currentPassword?.message}
            inputClassName="rounded-none"
            {...passwordForm.register('currentPassword')}
          />
          <PasswordField
            label="Nova senha"
            autoComplete="new-password"
            hint="Mínimo de 8 caracteres, com letras e números."
            error={wErrors.newPassword?.message}
            inputClassName="rounded-none"
            {...passwordForm.register('newPassword')}
          />
          <PasswordField
            label="Confirmar nova senha"
            autoComplete="new-password"
            error={wErrors.confirmPassword?.message}
            inputClassName="rounded-none"
            {...passwordForm.register('confirmPassword')}
          />
        </div>
      </fieldset>

      <Button type="submit" className="mt-8 w-[131px]" disabled={saving}>
        {saving ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}
