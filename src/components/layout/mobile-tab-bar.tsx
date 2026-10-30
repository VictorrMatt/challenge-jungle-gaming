import { Link, useRouterState } from '@tanstack/react-router'
import { ScanLine } from 'lucide-react'

import { CartFilledIcon } from '@/components/icons/brand-icons'
import { HeartSolidIcon, HomeSolidIcon, UserSolidIcon } from '@/components/icons/tab-icons'

import { useCartCount } from '@/features/cart/hooks'
import { useBump } from '@/lib/use-bump'
import { cn } from '@/lib/utils'

const ITEMS = [
  {
    to: '/',
    label: 'Início',
    Icon: HomeSolidIcon,
    left: '8.7%',
    match: (path: string) => path === '/',
  },
  {
    to: '/favoritos',
    label: 'Lista de interesse',
    Icon: HeartSolidIcon,
    left: '26.09%',
    match: (path: string) => path.startsWith('/favoritos'),
  },
  {
    to: '/carrinho',
    label: 'Carrinho',
    Icon: CartFilledIcon,
    left: '70.53%',
    match: (path: string) => path.startsWith('/carrinho'),
  },
  {
    to: '/perfil',
    label: 'Perfil',
    Icon: UserSolidIcon,
    left: '85.51%',
    match: (path: string) => path.startsWith('/perfil'),
  },
] as const

/** Bottom navigation from the mobile Figma frames (< 768px). */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const count = useCartCount()
  const bump = useBump(count)
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
        style={{ left: `calc(${item.left} + 10px)` }}
        className={cn(
          // 44px target centred on the 20px glyph Figma places at this x (bar top + 40px).
          'absolute top-[50px] grid size-11 -translate-x-1/2 place-items-center rounded-full',
          active ? 'text-highlight' : 'text-muted-foreground',
        )}
      >
        <item.Icon className="size-5" />
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden"
    >
      <div className="relative mx-auto h-[126px] max-w-[414px]">
        {/* Figma: 95px bar with 40px top corners and a round notch cradling the scan button. */}
        <div
          aria-hidden="true"
          className="pointer-events-auto absolute inset-x-0 top-[31px] bottom-0 rounded-t-[40px] bg-card [mask-image:radial-gradient(circle_at_50%_2px,transparent_49px,#000_50.5px)] shadow-[0_-8px_24px_rgba(0,0,0,0.35)]"
        />
        <div className="pointer-events-auto">
          {ITEMS.map(renderItem)}
          <Link
            to="/"
            hash="catalogo"
            aria-label="Explorar coleções"
            className="absolute top-0 left-1/2 grid size-[65px] -translate-x-1/2 place-items-center rounded-full gradient-primary text-primary-foreground shadow-[0_8px_20px_-6px_rgba(210,138,76,0.55)]"
          >
            <ScanLine className="size-7" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-auto h-[env(safe-area-inset-bottom)] bg-card"
      />
    </nav>
  )
}
