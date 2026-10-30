import { Link, useRouterState } from '@tanstack/react-router'
import { Heart, House, ScanLine, ShoppingCart, User } from 'lucide-react'

import { useCartCount } from '@/features/cart/hooks'
import { useBump } from '@/lib/use-bump'
import { cn } from '@/lib/utils'

const ITEMS = [
  { to: '/', label: 'Início', Icon: House, match: (path: string) => path === '/' },
  {
    to: '/favoritos',
    label: 'Lista de interesse',
    Icon: Heart,
    match: (path: string) => path.startsWith('/favoritos'),
  },
  {
    to: '/carrinho',
    label: 'Carrinho',
    Icon: ShoppingCart,
    match: (path: string) => path.startsWith('/carrinho'),
  },
  {
    to: '/perfil',
    label: 'Perfil',
    Icon: User,
    match: (path: string) => path.startsWith('/perfil'),
  },
] as const

/** Bottom navigation from the mobile Figma frames (< 768px). */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const count = useCartCount()
  const bump = useBump(count)
  const [first, second, third, fourth] = ITEMS

  const renderItem = (item: (typeof ITEMS)[number]) => {
    const active = item.match(pathname)
    const label =
      item.to === '/carrinho' && count > 0 ? `${item.label}, ${count} itens` : item.label
    return (
      <Link
        key={item.to}
        to={item.to}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative grid size-11 place-items-center rounded-full',
          active ? 'text-highlight' : 'text-muted-foreground',
        )}
      >
        <item.Icon className="size-6" fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
        {item.to === '/carrinho' && count > 0 && (
          <span
            key={bump}
            aria-hidden="true"
            className={cn(
              'absolute top-1 right-0 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 font-bold text-primary-foreground',
              bump > 0 && 'animate-pop',
            )}
          >
            {count}
          </span>
        )}
      </Link>
    )
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 h-[84px] rounded-t-[28px] bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.35)] md:hidden"
    >
      <div className="mx-auto grid h-full max-w-[414px] grid-cols-5 items-center justify-items-center px-4">
        {renderItem(first)}
        {renderItem(second)}
        <Link
          to="/"
          hash="catalogo"
          aria-label="Explorar coleções"
          className="-mt-14 grid size-16 place-items-center rounded-full border-[6px] border-background bg-primary text-primary-foreground shadow-lg"
        >
          <ScanLine className="size-7" aria-hidden="true" />
        </Link>
        {renderItem(third)}
        {renderItem(fourth)}
      </div>
    </nav>
  )
}
