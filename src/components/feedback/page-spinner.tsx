import { Loader2 } from 'lucide-react'

/** Fallback while a route chunk loads. Data-driven areas use skeletons instead. */
export function PageSpinner() {
  return (
    <div role="status" className="grid min-h-[40vh] place-items-center text-highlight">
      <Loader2 className="size-8 animate-spin" aria-hidden="true" />
      <span className="sr-only">Carregando…</span>
    </div>
  )
}
