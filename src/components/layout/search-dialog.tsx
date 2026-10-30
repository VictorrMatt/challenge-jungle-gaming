import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

/** Desktop search: submits into the catalog URL state (`/?q=`), so results are shareable. */
export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const urlQuery = useRouterState({
    select: (state) => {
      const q = (state.location.search as { q?: unknown }).q
      return typeof q === 'string' ? q : ''
    },
  })
  const [term, setTerm] = useState(urlQuery)
  const [wasOpen, setWasOpen] = useState(open)
  if (open && !wasOpen) {
    setWasOpen(true)
    setTerm(urlQuery)
  } else if (!open && wasOpen) {
    setWasOpen(false)
  }
  const inputId = useId()

  function submit(event: FormEvent) {
    event.preventDefault()
    onOpenChange(false)
    void navigate({
      to: '/',
      search: (previous) => ({ ...previous, q: term.trim() || undefined, page: undefined }),
      hash: 'catalogo',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] translate-y-0 border-border bg-card sm:max-w-lg">
        <DialogTitle>Buscar NFTs</DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Pesquise por nome do NFT ou coleção.
        </DialogDescription>
        <form onSubmit={submit} className="flex gap-2" role="search">
          <label htmlFor={inputId} className="sr-only">
            Termo de busca
          </label>
          <Input
            id={inputId}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Ex.: Emerald Ape"
            autoComplete="off"
            maxLength={80}
          />
          <Button type="submit" aria-label="Buscar">
            <Search aria-hidden="true" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
