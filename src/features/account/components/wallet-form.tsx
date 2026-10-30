import { ChevronDown } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { applyFieldErrors } from '@/components/form/field-errors'
import { FormField } from '@/components/form/form-field'
import { FormSelect } from '@/components/form/form-select'
import { Button } from '@/components/ui/button'
import { NETWORK_OPTIONS, WALLET_TYPE_LABEL } from '@/features/checkout/components/wallet-format'
import { errorMessage, isApiClientError } from '@/lib/api/errors'
import { walletInput, type WalletInput, type WalletSlot } from '@/shared/contracts'

import { useSaveWallet } from '../hooks'

const WALLET_TYPES = (Object.keys(WALLET_TYPE_LABEL) as Array<keyof typeof WALLET_TYPE_LABEL>).map(
  (value) => ({
    value,
    label: WALLET_TYPE_LABEL[value],
  }),
)

const FIELDS = [
  'displayName',
  'nickname',
  'network',
  'profileName',
  'address',
  'secondaryAddress',
  'type',
  'referralCode',
  'email',
  'ensName',
] as const

/** Wallet registration/editing form (Figma "Carteiras"), shared by primary and secondary slots. */
export function WalletForm({
  slot,
  initial,
  onSaved,
}: {
  slot: WalletSlot
  initial: WalletInput
  onSaved?: () => void
}) {
  const save = useSaveWallet()
  const form = useForm<WalletInput>({
    resolver: zodResolver(walletInput),
    defaultValues: initial,
    mode: 'onTouched',
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) =>
    save.mutate(
      { slot, body: values },
      {
        onSuccess: (wallet) => {
          form.reset({ ...values, secondaryAddress: wallet.secondaryAddress })
          toast.success(
            slot === 'primary' ? 'Carteira principal salva.' : 'Carteira secundária salva.',
          )
          onSaved?.()
        },
        onError: (error) => {
          if (isApiClientError(error) && applyFieldErrors(error.fieldErrors, form.setError, FIELDS))
            return
          toast.error(errorMessage(error))
        },
      },
    ),
  )

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={save.isPending} className="mt-[22px]">
      <div className="grid gap-x-7 gap-y-7 md:grid-cols-2">
        <FormField
          label="Nome de exibição"
          required
          error={errors.displayName?.message}
          {...form.register('displayName')}
        />
        <FormField
          label="Apelido da carteira"
          required
          error={errors.nickname?.message}
          {...form.register('nickname')}
        />
        <FormSelect
          label="Rede"
          required
          placeholder="Selecione uma rede"
          options={NETWORK_OPTIONS}
          error={errors.network?.message}
          {...form.register('network')}
        />
        <FormField
          label="Nome do perfil"
          required
          error={errors.profileName?.message}
          {...form.register('profileName')}
        />
        <FormField
          label="Endereço da carteira"
          required
          placeholder="Endereço 0x da carteira"
          autoComplete="off"
          spellCheck={false}
          error={errors.address?.message}
          inputClassName="font-mono text-sm"
          {...form.register('address')}
        />
        <FormField
          label="ENS ou carteira secundária (opcional)"
          placeholder="ENS ou carteira secundária (opcional)"
          autoComplete="off"
          spellCheck={false}
          error={errors.secondaryAddress?.message}
          className="md:[&>label]:invisible"
          inputClassName="text-sm"
          {...form.register('secondaryAddress')}
        />
        <FormSelect
          label="Tipo de carteira"
          required
          placeholder="Selecione uma carteira"
          options={WALLET_TYPES}
          error={errors.type?.message}
          {...form.register('type')}
        />
        <FormField
          label="Código de indicação"
          required
          error={errors.referralCode?.message}
          inputClassName="uppercase"
          {...form.register('referralCode')}
        />
        <FormField
          label="E-mail"
          required
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <FormField
          label="Nome ENS"
          required
          error={errors.ensName?.message}
          inputClassName="pl-[96px]"
          leading={
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 flex w-[78px] items-center justify-between border border-input px-3 text-base whitespace-nowrap text-foreground"
            >
              .eth <ChevronDown className="size-4" />
            </span>
          }
          {...form.register('ensName')}
        />
      </div>
      <Button type="submit" className="mt-8 h-10 px-0.5 text-sm" disabled={save.isPending}>
        {save.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}
