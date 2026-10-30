import { useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

/** Mobile screen header: back button + centered title (Figma mobile cart/payment). */
export function MobileTopBar({ title, fallback = '/' }: { title: string; fallback?: string }) {
  const router = useRouter()
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-[34px_1fr_34px] items-center px-6 pt-8 pb-4 md:hidden">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() =>
          router.history.length > 1 ? router.history.back() : void navigate({ to: fallback })
        }
        className="grid size-[34px] place-items-center rounded-full bg-card text-foreground"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <h1 className="text-center text-xl font-bold text-foreground">{title}</h1>
    </div>
  )
}
