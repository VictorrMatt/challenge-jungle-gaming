import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  CircleUserRound,
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

import { useLogout } from '@/features/auth/hooks'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_private/perfil')({
  component: ProfileLayout,
})

type Item = { label: string; Icon: LucideIcon; to?: '/perfil' | '/perfil/carteiras' | '/favoritos' }

/** Activity, offers, downloads and support are out of scope: listed, but marked "em breve". */
const ITEMS: Item[] = [
  { label: 'Dados do perfil', Icon: CircleUserRound, to: '/perfil' },
  { label: 'Carteiras', Icon: MapPin, to: '/perfil/carteiras' },
  { label: 'Atividade', Icon: ShoppingCart },
  { label: 'Lista de interesse', Icon: Heart, to: '/favoritos' },
  { label: 'Ofertas', Icon: TrendingUp },
  { label: 'Arquivos baixados', Icon: Download },
  { label: 'Suporte', Icon: TriangleAlert },
]

function ProfileLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const logout = useLogout()

  return (
    <div className="container-page pt-6 md:pt-8">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-7 lg:grid-cols-[310px_minmax(0,1fr)]">
        <nav aria-label="Meu perfil" className="min-w-0 bg-card pt-4 lg:self-start">
          <h1 className="px-2.5 text-xl font-bold text-foreground">Meu perfil</h1>
          <ul className="mt-1 flex gap-1 overflow-x-auto px-2 pb-2 lg:block lg:px-0 lg:pb-0">
            {ITEMS.map(({ label, Icon, to }) => {
              const active =
                to !== undefined &&
                (to === '/perfil'
                  ? pathname === '/perfil' || pathname === '/perfil/'
                  : pathname.startsWith(to))
              const content = (
                <>
                  <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                  {label}
                </>
              )
              const base =
                'flex h-[45px] shrink-0 items-center gap-3 border-l-[6px] px-2.5 text-base whitespace-nowrap lg:pl-3'
              return (
                <li key={label}>
                  {to ? (
                    <Link
                      to={to}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        base,
                        active
                          ? 'border-primary text-highlight'
                          : 'border-transparent text-highlight/90 hover:text-foreground',
                      )}
                    >
                      {content}
                    </Link>
                  ) : (
                    <span
                      className={cn(base, 'border-transparent text-highlight/50 max-lg:hidden')}
                      title="Em breve"
                    >
                      {content}
                      <span className="sr-only">(em breve)</span>
                    </span>
                  )}
                </li>
              )
            })}
            <li className="lg:mt-0 lg:border-t lg:border-border">
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="flex h-[45px] w-full shrink-0 items-center gap-3 px-2.5 text-base font-bold whitespace-nowrap text-highlight hover:text-foreground lg:pl-4"
              >
                <LogOut className="size-5" aria-hidden="true" /> Sair
              </button>
            </li>
          </ul>
        </nav>
        <div className="min-w-0 pb-16">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
