import { Link } from '@tanstack/react-router'
import { CircleCheck, Unplug, Wallet as WalletIcon } from 'lucide-react'
import { useId } from 'react'

import { WalletBadges } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'
import type { Wallet, WalletSession, WalletType, WalletsResponse } from '@/shared/contracts'

import { NETWORK_OPTIONS, shortAddress, WALLET_TYPE_LABEL } from './wallet-format'

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-[18px] shrink-0 place-items-center rounded-full border-2 max-md:size-4 max-md:border-[1.5px]',
        checked ? 'border-primary' : 'border-input',
      )}
    >
      {checked && <span className="size-2 rounded-full bg-primary max-md:size-[7px]" />}
    </span>
  )
}

/** Registered wallets (primary / secondary) as a radio group — "Carteira conectada" in Figma. */
export function RegisteredWallets({
  wallets,
  value,
  onChange,
  session,
}: {
  wallets: WalletsResponse
  value: string | undefined
  onChange: (wallet: Wallet) => void
  session: WalletSession | undefined
}) {
  const labelId = useId()
  const list = [wallets.primary, wallets.secondary].filter(
    (wallet): wallet is Wallet => wallet !== null,
  )

  if (list.length === 0) {
    return (
      <div role="alert" className="rounded-xl bg-card p-4 text-sm">
        Você ainda não cadastrou carteiras.{' '}
        <Link to="/perfil/carteiras" className="font-bold text-highlight hover:underline">
          Cadastrar carteira
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 id={labelId} className="text-base leading-4 font-bold text-foreground">
          Carteira conectada
        </h3>
        <Link
          to="/perfil/carteiras"
          className="text-sm leading-4 font-bold text-highlight hover:underline"
        >
          Trocar carteira
        </Link>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="mt-3 space-y-3 max-md:mt-4 max-md:space-y-5"
      >
        {list.map((wallet) => {
          const checked = wallet.id === value
          const connected = session?.walletId === wallet.id && session.status === 'connected'
          return (
            <button
              key={wallet.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(wallet)}
              className={cn(
                'flex w-full items-center gap-4 rounded-xl border bg-card px-4 py-3 text-left transition-colors',
                // Mobile (Figma): 93px card, 14px radius, soft drop shadow; selection via radio only.
                'max-md:min-h-[93px] max-md:gap-[19px] max-md:rounded-[14px] max-md:border-0 max-md:pl-[19px] max-md:shadow-[0_20px_20px_rgba(10,6,4,0.45)]',
                checked ? 'border-primary' : 'border-transparent hover:border-input',
              )}
            >
              <Radio checked={checked} />
              <span className="min-w-0 flex-1 max-md:text-sm max-md:leading-[22px]">
                <span className="block font-bold text-foreground max-md:mb-1.5 max-md:text-base max-md:leading-4">
                  {wallet.nickname}
                  <span className="text-xs font-normal text-muted-foreground max-md:hidden">
                    {' '}
                    ({wallet.slot === 'primary' ? 'principal' : 'secundária'})
                  </span>
                </span>
                <span className="block truncate text-sm text-muted-foreground max-md:hidden">
                  {wallet.ensName ? `${wallet.ensName}.eth · ` : ''}
                  {shortAddress(wallet.address)}
                </span>
                <span className="block truncate text-muted-foreground md:hidden">
                  {wallet.ensName ? `${wallet.ensName}.eth` : shortAddress(wallet.address)}
                </span>
                <span className="block text-sm text-muted-foreground">
                  Rede {NETWORK_OPTIONS.find((option) => option.value === wallet.network)?.label}
                  <span className="max-md:hidden"> · {WALLET_TYPE_LABEL[wallet.type]}</span>
                </span>
              </span>
              {connected && (
                <span className="flex items-center gap-1 text-xs font-bold text-success">
                  <CircleCheck className="size-4" aria-hidden="true" /> Conectada
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Connection status + disconnect (simulated wallet session). */
export function ConnectionStatus({
  session,
  wallet,
  onDisconnect,
  disconnecting,
}: {
  session: WalletSession | undefined
  wallet: Wallet | undefined
  onDisconnect: () => void
  disconnecting: boolean
}) {
  const connected = session?.status === 'connected' && wallet?.id === session.walletId
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-sm border border-input px-3 py-2 text-sm"
    >
      <span className="flex items-center gap-2">
        <WalletIcon
          className={cn('size-4', connected ? 'text-success' : 'text-subtle-foreground')}
          aria-hidden="true"
        />
        {connected
          ? `${WALLET_TYPE_LABEL[wallet.type]} conectada em ${NETWORK_OPTIONS.find((option) => option.value === session.network)?.label}`
          : 'Carteira não conectada — conectaremos ao confirmar.'}
      </span>
      {connected && (
        <button
          type="button"
          onClick={onDisconnect}
          disabled={disconnecting}
          className="flex items-center gap-1 font-bold text-highlight hover:underline"
        >
          <Unplug className="size-4" aria-hidden="true" /> Desconectar
        </button>
      )}
    </div>
  )
}

/** "Carteira e rede" providers (Figma radios). The provider reflects the selected wallet type. */
export function ProviderList({
  type,
  onSelectType,
}: {
  type: WalletType | undefined
  onSelectType: (type: WalletType) => void
}) {
  const labelId = useId()
  const options: WalletType[] = ['walletconnect', 'metamask', 'coinbase']
  return (
    <div>
      <h3
        id={labelId}
        className="text-center text-lg font-bold text-foreground max-md:text-left max-md:text-base max-md:leading-4"
      >
        Carteira e rede
      </h3>
      <div role="radiogroup" aria-labelledby={labelId} className="mt-6 space-y-4 max-md:mt-4">
        <div
          className="hidden h-[45px] items-center gap-4 border border-input px-4 md:flex"
          aria-hidden="true"
        >
          <Radio checked={false} />
          <WalletBadges />
        </div>
        {options.map((option) => {
          const checked = option === type
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onSelectType(option)}
              className={cn(
                'flex h-[45px] w-full items-center gap-4 border px-4 text-left text-base text-foreground transition-colors',
                // Mobile (Figma): 65px rows, 15px radius, 40px monogram, radio on the right.
                'max-md:h-[65px] max-md:flex-row-reverse max-md:justify-between max-md:rounded-[15px] max-md:border-0 max-md:bg-card max-md:pr-[17px] max-md:pl-3.5 max-md:text-sm max-md:leading-4 max-md:shadow-[0_0_20px_rgba(10,6,4,0.45)]',
                checked ? 'border-primary' : 'border-input hover:border-primary/60',
              )}
            >
              <Radio checked={checked} />
              <span className="flex items-center gap-3 max-md:gap-[11px]">
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-full bg-secondary text-sm font-bold text-highlight md:hidden"
                >
                  {option === 'coinbase' ? (
                    <WalletIcon className="size-[18px]" strokeWidth={1.75} />
                  ) : (
                    WALLET_TYPE_LABEL[option][0]
                  )}
                </span>
                {WALLET_TYPE_LABEL[option]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
