import { FlaskConical } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { EditionId } from '@/shared/contracts'

import { mockControls } from '../controls'

const HIDE_KEY = 'kurio:scenario-panel'

function isHidden() {
  const param = new URLSearchParams(location.search).get('panel')
  if (param === 'off') sessionStorage.setItem(HIDE_KEY, 'off')
  if (param === 'on') sessionStorage.removeItem(HIDE_KEY)
  return sessionStorage.getItem(HIDE_KEY) === 'off'
}

/**
 * Demo/evaluation panel for the simulated backend (mock layer only — it never touches app state;
 * every action changes the mock server and flows back through REST/Socket.IO).
 * Hide with `?panel=off` (used by visual tests and Lighthouse); show again with `?panel=on`.
 */
export default function ScenarioPanel() {
  const [hidden] = useState(isHidden)
  const [active, setActive] = useState<string[]>(mockControls.getScenario())
  const [nftId, setNftId] = useState('emerald-ape-042')
  const [price, setPrice] = useState('1.49')
  const [edition, setEdition] = useState<EditionId>('1-50')
  const ids = { nft: useId(), price: useId(), edition: useId() }

  if (hidden) return null

  const toggle = (name: string) => {
    const next = active.includes(name)
      ? active.filter((item) => item !== name)
      : [...active.filter((item) => item !== 'default'), name]
    setActive(mockControls.setScenario(next.length ? next : ['default']))
  }

  const run = (label: string, action: () => unknown) => {
    const result = action()
    toast.info(result === false ? `${label}: nada a fazer.` : `${label}: executado.`, {
      id: 'mock-action',
    })
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="fixed bottom-24 left-3 z-40 flex items-center gap-2 rounded-full border border-primary bg-card px-3 py-2 text-xs font-bold text-highlight shadow-lg md:bottom-4"
          aria-label="Abrir painel de cenários de simulação"
        >
          <FlaskConical className="size-4" aria-hidden="true" /> Cenários
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[360px] overflow-y-auto border-border bg-card p-5 sm:max-w-[360px]"
      >
        <SheetHeader className="p-0">
          <SheetTitle>Simulação (MSW)</SheetTitle>
          <SheetDescription>
            Cenários combináveis do backend simulado. Ativos: {active.join(', ')}
          </SheetDescription>
        </SheetHeader>

        <fieldset className="mt-4">
          <legend className="text-sm font-bold">Cenários de rede e negócio</legend>
          <ul className="mt-2 space-y-1">
            {Object.entries(mockControls.scenarios).map(([name, description]) => (
              <li key={name}>
                <label className="flex cursor-pointer gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[var(--primary)]"
                    checked={active.includes(name)}
                    onChange={() => toggle(name)}
                  />
                  <span>
                    <code className="text-highlight">{name}</code> —{' '}
                    <span className="text-muted-foreground">{description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className="mt-6 space-y-2">
          <legend className="text-sm font-bold">Eventos em tempo real (Socket.IO)</legend>
          <div className="grid grid-cols-2 gap-2">
            <label htmlFor={ids.nft} className="col-span-2 text-xs text-muted-foreground">
              NFT (id)
              <input
                id={ids.nft}
                value={nftId}
                onChange={(event) => setNftId(event.target.value)}
                className="mt-1 h-8 w-full border border-input bg-background px-2 text-sm text-foreground"
              />
            </label>
            <label htmlFor={ids.price} className="text-xs text-muted-foreground">
              Novo preço (ETH)
              <input
                id={ids.price}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="mt-1 h-8 w-full border border-input bg-background px-2 text-sm text-foreground"
              />
            </label>
            <label htmlFor={ids.edition} className="text-xs text-muted-foreground">
              Edição
              <select
                id={ids.edition}
                value={edition}
                onChange={(event) => setEdition(event.target.value as EditionId)}
                className="mt-1 h-8 w-full border border-input bg-background px-2 text-sm text-foreground"
              >
                <option value="1-1">1/1</option>
                <option value="1-10">1/10</option>
                <option value="1-50">1/50</option>
                <option value="open">Aberta</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              onClick={() => run('Preço alterado', () => mockControls.setNftPrice(nftId, price))}
            >
              Alterar preço
            </Button>
            <Button
              size="sm"
              onClick={() =>
                run('Edição esgotada', () => mockControls.setAvailability(nftId, edition, 0))
              }
            >
              Esgotar edição
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => run('Evento duplicado', mockControls.socket.replayLastEvent)}
            >
              Duplicar último evento
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => run('Evento antigo', mockControls.socket.sendStaleNftEvent)}
            >
              Enviar evento antigo
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="col-span-2"
              onClick={() =>
                run('Conexão interrompida por 5 s', () => mockControls.socket.interrupt(5000))
              }
            >
              Derrubar conexão (5 s)
            </Button>
          </div>
        </fieldset>

        <fieldset className="mt-6 space-y-2">
          <legend className="text-sm font-bold">Sessão, carteira e dados</legend>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => run('Sessões expiradas', mockControls.expireSessions)}
            >
              Expirar sessão
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => run('Carteiras desconectadas', mockControls.disconnectWallets)}
            >
              Desconectar carteira
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="col-span-2"
              onClick={async () => {
                await mockControls.reset()
                localStorage.removeItem('kurio:session')
                localStorage.removeItem('kurio:guest-cart-id')
                sessionStorage.clear()
                location.assign('/')
              }}
            >
              Resetar dados para o cenário inicial
            </Button>
          </div>
        </fieldset>
      </SheetContent>
    </Sheet>
  )
}
