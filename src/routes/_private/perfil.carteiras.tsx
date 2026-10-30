import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { ErrorState } from '@/components/feedback/error-state'
import { FieldSkeleton } from '@/components/ui/skeleton'
import { WalletForm } from '@/features/account/components/wallet-form'
import { EMPTY_WALLET } from '@/features/account/wallet-defaults'
import { useWallets } from '@/features/account/hooks'
import { errorMessage } from '@/lib/api/errors'
import type { Wallet, WalletInput } from '@/shared/contracts'

export const Route = createFileRoute('/_private/perfil/carteiras')({
  head: () => ({ meta: [{ title: 'Carteiras — Kurio' }] }),
  component: WalletsPage,
})

function toInput(wallet: Wallet): WalletInput {
  const { id: _id, slot: _slot, updatedAt: _updatedAt, ...input } = wallet
  return input
}

function WalletsPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useWallets()
  const [editingPrimary, setEditingPrimary] = useState(false)
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

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
      <div role="status" aria-label="Carregando carteiras" className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => (
          <FieldSkeleton key={index} index={index} />
        ))}
      </div>
    )
  }

  const showPrimaryForm = editingPrimary || data.primary !== null
  const showSecondaryForm = addingSecondary || data.secondary !== null
  // "Igual à carteira principal" copies the primary data (the address must still differ).
  const secondaryInitial = data.secondary
    ? toInput(data.secondary)
    : sameAsPrimary && data.primary
      ? { ...toInput(data.primary), address: '', nickname: '' }
      : EMPTY_WALLET

  return (
    <div>
      <section aria-labelledby="carteira-principal">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="carteira-principal" className="text-base font-bold text-foreground">
              Carteira principal
            </h2>
            <p className="text-sm text-muted-foreground">
              Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
            </p>
          </div>
          {!showPrimaryForm && (
            <button
              type="button"
              onClick={() => setEditingPrimary(true)}
              className="text-base font-bold text-highlight hover:underline"
            >
              Adicionar
            </button>
          )}
        </div>
        {showPrimaryForm ? (
          <WalletForm
            key={data.primary?.updatedAt ?? 'new-primary'}
            slot="primary"
            initial={data.primary ? toInput(data.primary) : EMPTY_WALLET}
          />
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Você ainda não adicionou uma carteira principal.
          </p>
        )}
      </section>

      <section aria-labelledby="carteira-secundaria" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="carteira-secundaria" className="text-lg font-bold text-foreground">
            Carteira secundária
          </h2>
          {!data.secondary && (
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-base text-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--primary)]"
                  checked={sameAsPrimary}
                  disabled={!data.primary}
                  onChange={(event) => {
                    setSameAsPrimary(event.target.checked)
                    setAddingSecondary(true)
                  }}
                />
                Igual à carteira principal
              </label>
              {!addingSecondary && (
                <button
                  type="button"
                  onClick={() => setAddingSecondary(true)}
                  disabled={!data.primary}
                  title={data.primary ? undefined : 'Cadastre a carteira principal primeiro'}
                  className="text-lg font-bold text-highlight hover:underline disabled:opacity-50"
                >
                  Adicionar
                </button>
              )}
            </div>
          )}
        </div>
        {showSecondaryForm ? (
          <WalletForm
            key={`${data.secondary?.updatedAt ?? 'new-secondary'}-${sameAsPrimary}`}
            slot="secondary"
            initial={secondaryInitial}
            onSaved={() => setAddingSecondary(false)}
          />
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Você ainda não adicionou uma carteira secundária.
          </p>
        )}
      </section>
    </div>
  )
}
