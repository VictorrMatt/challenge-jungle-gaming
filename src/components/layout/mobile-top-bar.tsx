import { useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Mobile screen header: back button + centered title (Figma mobile cart/payment). */
export function MobileTopBar({
  title,
  fallback = '/',
  align = 'center',
}: {
  title: string
  fallback?: string
  /** Figma centres "Carrinho de NFTs" but starts "Pagamento com carteira" right after the back button. */
  align?: 'center' | 'start'
}) {
  const router = useRouter()
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-[35px_1fr_35px] items-center px-7 pt-8 pb-[21px] md:hidden">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() =>
          router.history.length > 1 ? router.history.back() : void navigate({ to: fallback })
        }
        className="grid size-[35px] place-items-center rounded-full border border-border bg-secondary text-subtle-foreground"
      >
        <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </button>
      <h1
        className={cn(
          'text-xl leading-4 font-bold text-foreground',
          align === 'center' ? 'text-center' : 'col-span-2 pl-6',
        )}
      >
        {title}
      </h1>
    </div>
  )
}
