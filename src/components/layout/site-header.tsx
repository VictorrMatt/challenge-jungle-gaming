import { Link, useRouterState } from '@tanstack/react-router'
import { LogOut, Search, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

import { useCurrentUser } from '@/features/auth/session-store'
import { useCartCount } from '@/features/cart/hooks'
import { useBump } from '@/lib/use-bump'
import { cn } from '@/lib/utils'

import { Logo } from './logo'
import { SearchDialog } from './search-dialog'
import { UserMenu } from './user-menu'

const NAV = [
  { label: 'Início', to: '/', hash: undefined, match: (path: string) => path === '/' },
  {
    label: 'Mercado',
    to: '/',
    hash: 'catalogo',
    match: (path: string) =>
      path.startsWith('/nft') || path.startsWith('/carrinho') || path.startsWith('/pagamento'),
  },
  { label: 'Criadores', to: '/', hash: 'criadores', match: () => false },
  { label: 'Aprenda', to: '/', hash: 'diario', match: () => false },
] as const

/** Desktop/tablet header (≥ 768px). Mobile screens use their own top bars + tab bar (Figma). */
export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const user = useCurrentUser()
  const count = useCartCount()
  const bump = useBump(count)
  const [searchOpen, setSearchOpen] = useState(false)
  const showDivider =
    pathname === '/' ||
    pathname.startsWith('/perfil') ||
    pathname === '/entrar' ||
    pathname === '/cadastro'

  return (
    <header className="hidden pt-6 md:block">
      <div className="container-page">
        <div
          className={cn(
            'relative flex h-[45px] items-start justify-between',
            showDivider && 'border-b border-border-accent',
          )}
        >
          <Logo className="mt-[9px]" />

          <nav
            aria-label="Principal"
            className="absolute left-1/2 flex -translate-x-1/2 gap-4 lg:left-[376px] lg:translate-x-0 lg:gap-10"
          >
            {NAV.map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  hash={item.hash}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex h-[45px] items-start pt-0 text-sm leading-[1.4] text-foreground transition-colors hover:text-highlight lg:text-base',
                    active &&
                      'font-bold text-highlight after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3 lg:gap-7">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mt-1 grid size-7 place-items-center rounded-sm text-foreground hover:text-highlight"
              aria-label="Buscar NFTs"
            >
              <Search className="size-5" strokeWidth={2.2} />
            </button>
            <Link
              to="/carrinho"
              className="relative mt-1 grid size-7 place-items-center rounded-sm text-foreground hover:text-highlight"
              aria-label={
                count > 0
                  ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`
                  : 'Carrinho vazio'
              }
            >
              <ShoppingCart className="size-6" strokeWidth={2} />
              {count > 0 && (
                <span
                  key={bump}
                  aria-hidden="true"
                  className={cn(
                    'absolute -top-1 -right-2 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-medium text-primary-foreground',
                    bump > 0 && 'animate-pop',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link
                to="/entrar"
                search={{
                  redirect:
                    pathname === '/entrar' || pathname === '/cadastro' ? undefined : pathname,
                }}
                className="flex h-[35px] w-[100px] items-center justify-center gap-1 rounded-md bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-highlight"
              >
                <LogOut className="size-5" strokeWidth={2} aria-hidden="true" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
