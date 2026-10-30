import { Link, useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'

import { FacebookColorIcon, GoogleIcon } from '@/components/icons/brand-icons'
import { Logo } from '@/components/layout/logo'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'register'

/** Social sign-in is out of scope: buttons explain that instead of faking a login. */
function unavailable(provider: string) {
  toast.info(`Entrar com ${provider} não está disponível nesta demonstração. Use e-mail e senha.`, {
    id: 'social-auth',
  })
}

export function SocialButtons({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3 text-sm text-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        Ou continue com
      </div>
      <button
        type="button"
        onClick={() => unavailable('Google')}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-input text-sm font-bold text-muted-foreground hover:border-primary/60"
      >
        <GoogleIcon className="size-5" /> Continuar com Google
      </button>
      <button
        type="button"
        onClick={() => unavailable('Facebook')}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-input text-sm font-bold text-muted-foreground hover:border-primary/60"
      >
        <FacebookColorIcon className="size-5" /> Continuar com Facebook
      </button>
    </div>
  )
}

function ModeSwitch({ mode, redirect }: { mode: Mode; redirect?: string }) {
  return (
    <nav aria-label="Acesso" className="flex items-center justify-center text-xl font-bold">
      <Link
        to="/entrar"
        search={{ redirect }}
        aria-current={mode === 'login' ? 'page' : undefined}
        className={cn(
          'pr-2',
          mode === 'login' ? 'text-highlight' : 'text-foreground hover:text-highlight',
        )}
      >
        Entrar
      </Link>
      <span aria-hidden="true" className="h-6 w-px bg-primary" />
      <Link
        to="/cadastro"
        search={{ redirect }}
        aria-current={mode === 'register' ? 'page' : undefined}
        className={cn(
          'pl-2',
          mode === 'register' ? 'text-highlight' : 'text-foreground hover:text-highlight',
        )}
      >
        Criar conta
      </Link>
    </nav>
  )
}

/**
 * Desktop: modal over the marketplace (Figma "Login"/"Cadastro"), with focus trapped and
 * Esc/close returning to where the collector came from. Mobile: full-screen page.
 */
export function AuthShell({
  mode,
  redirect,
  description,
  mobileTitle,
  mobileFooter,
  children,
}: {
  mode: Mode
  redirect?: string
  description: string
  mobileTitle: string
  mobileFooter: ReactNode
  children: ReactNode
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const navigate = useNavigate()
  const close = () =>
    void navigate({
      to: redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/',
    })

  if (!isDesktop) {
    return (
      <section aria-labelledby="auth-title" className="mx-auto max-w-[414px] px-7 pt-[110px] pb-12">
        <div className="text-center">
          <Logo size="lg" />
        </div>
        <h1
          id="auth-title"
          className="mt-[78px] text-center text-lg font-bold text-foreground min-[400px]:text-xl"
        >
          {mobileTitle}
        </h1>
        <div className="mt-8">{children}</div>
        <SocialButtons className="mt-10" />
        <div className="mt-12 text-center text-base text-muted-foreground">{mobileFooter}</div>
      </section>
    )
  }

  return (
    <>
      <div aria-hidden="true" inert className="pointer-events-none select-none">
        <HomeHero />
      </div>
      <Dialog open onOpenChange={(open) => !open && close()}>
        <DialogContent
          showCloseButton={false}
          className="top-[160px] w-[500px] max-w-[calc(100vw-2rem)] translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-card p-0 pb-0 shadow-2xl sm:max-w-[500px]"
        >
          <div className="px-20 pt-12 pb-10">
            <DialogTitle className="sr-only">
              {mode === 'login' ? 'Entrar na Kurio' : 'Criar conta na Kurio'}
            </DialogTitle>
            <ModeSwitch mode={mode} redirect={redirect} />
            <DialogDescription className="mt-8 text-center text-sm leading-[1.2] text-foreground">
              {description}
            </DialogDescription>
            <div className="mt-6">{children}</div>
          </div>
          <SocialButtons className="px-20 pb-[94px] [&>div:first-child]:-mx-20" />
          <div aria-hidden="true" className="h-2.5 bg-primary" />
          <DialogClose
            className="absolute top-3 right-4 grid size-8 place-items-center text-highlight hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}
