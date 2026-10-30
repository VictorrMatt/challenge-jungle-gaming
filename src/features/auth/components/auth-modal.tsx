import { defaultStringifySearch, Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useEffect } from 'react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'

import { AUTH_PATHS, type AuthMode, authModalLocation, DESKTOP_QUERY } from '../auth-modal'
import { LoginForm, RegisterForm } from './auth-forms'
import { SocialButtons } from './auth-shell'

const COPY: Record<AuthMode, { title: string; description: string }> = {
  entrar: {
    title: 'Entrar na Kurio',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  cadastro: {
    title: 'Criar conta na Kurio',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
}

/**
 * Desktop sign-in / sign-up modal (Figma "Login" / "Cadastro"), opened over whatever page the
 * collector is on via the `auth` search param — the page underneath stays mounted. Closing it
 * (×, Esc, overlay) just drops the param; signing in resumes `redirect` (the page behind by
 * default). On phones the param hands over to the full-screen routes.
 */
export function AuthModal() {
  const location = useRouterState({ select: (state) => state.location })
  const search = location.search as { auth?: AuthMode; redirect?: string }
  const mode = search.auth
  const redirect = search.redirect
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const navigate = useNavigate()

  // The page behind, without the modal params (used by the Entrar ↔ Criar conta switch).
  const { auth: _auth, redirect: _redirect, ...rest } = location.search as Record<string, unknown>
  const background = `${location.pathname}${defaultStringifySearch(rest)}`

  useEffect(() => {
    if (mode && !isDesktop) {
      void navigate({ to: AUTH_PATHS[mode], search: { redirect }, replace: true })
    }
  }, [isDesktop, mode, navigate, redirect])

  if (!mode || !isDesktop) return null

  const close = () =>
    void navigate({
      to: '.',
      search: ((previous: Record<string, unknown>) => ({
        ...previous,
        auth: undefined,
        redirect: undefined,
      })) as never,
      replace: true,
      resetScroll: false,
    })

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className="top-[160px] w-[500px] max-w-[calc(100vw-2rem)] translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-card p-0 pb-0 shadow-2xl sm:max-w-[500px]"
      >
        <div className="pt-12">
          <DialogTitle className="sr-only">{COPY[mode].title}</DialogTitle>
          <nav
            aria-label="Acesso"
            className="flex items-center justify-center gap-2 text-xl leading-4 font-medium"
          >
            {(['entrar', 'cadastro'] as const).map((target, index) => (
              <span key={target} className="contents">
                {index > 0 && <span aria-hidden="true" className="h-4 w-px bg-destructive" />}
                <Link
                  {...authModalLocation(target, redirect, background)}
                  replace
                  aria-current={mode === target ? 'page' : undefined}
                  className={cn(
                    mode === target ? 'text-highlight' : 'text-foreground hover:text-highlight',
                  )}
                >
                  {target === 'entrar' ? 'Entrar' : 'Criar conta'}
                </Link>
              </span>
            ))}
          </nav>
          <DialogDescription className="mt-10 px-12 text-center text-[13px] leading-4 text-foreground">
            {COPY[mode].description}
          </DialogDescription>
          <div className="px-20 pt-6">
            {mode === 'entrar' ? (
              <LoginForm key="login" redirect={redirect} />
            ) : (
              <RegisterForm key="register" redirect={redirect} />
            )}
          </div>
        </div>
        <SocialButtons className="px-20 pt-6 pb-[94px] [&>div:first-child]:-mx-20" />
        <div aria-hidden="true" className="h-2.5 bg-primary" />
        <DialogClose
          className="absolute top-1.5 right-[7px] grid size-8 place-items-center text-highlight hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="size-[18px]" aria-hidden="true" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
