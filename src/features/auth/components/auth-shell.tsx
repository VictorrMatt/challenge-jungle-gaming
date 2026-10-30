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

export function SocialButtons({
  className,
  variant = 'desktop',
}: {
  className?: string
  variant?: 'desktop' | 'mobile'
}) {
  const mobile = variant === 'mobile'
  // Figma "Social Button": 40px, 5px radius, 13px medium label, 20px mark, 12px gap.
  const button =
    'flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-input text-[13px] leading-4 font-medium text-muted-foreground hover:border-primary/60'
  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'flex items-center text-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border',
          'text-[13px] leading-4',
          mobile ? 'gap-2.5' : 'gap-3',
        )}
      >
        Ou continue com
      </div>
      <button type="button" onClick={() => unavailable('Google')} className={button}>
        <GoogleIcon className="size-5" /> Continuar com Google
      </button>
      <button
        type="button"
        onClick={() => unavailable('Facebook')}
        className={cn(button, mobile && '!mt-4')}
      >
        <FacebookColorIcon className="size-5" /> Continuar com Facebook
      </button>
    </div>
  )
}

function ModeSwitch({ mode, redirect }: { mode: Mode; redirect?: string }) {
  return (
    <nav
      aria-label="Acesso"
      className="flex items-center justify-center gap-2 text-xl leading-4 font-medium"
    >
      <Link
        to="/entrar"
        search={{ redirect }}
        aria-current={mode === 'login' ? 'page' : undefined}
        className={cn(mode === 'login' ? 'text-highlight' : 'text-foreground hover:text-highlight')}
      >
        Entrar
      </Link>
      <span aria-hidden="true" className="h-4 w-px bg-destructive" />
      <Link
        to="/cadastro"
        search={{ redirect }}
        aria-current={mode === 'register' ? 'page' : undefined}
        className={cn(
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
      // Figma mobile auth: 80px top, 28px sides, 40px rhythm between logo, title, form and social.
      <section
        aria-labelledby="auth-title"
        className="mx-auto flex max-w-[414px] flex-col gap-10 px-7 pt-20 pb-6"
      >
        <div className="grid h-[136px] place-items-center">
          <Logo size="lg" />
        </div>
        <h1
          id="auth-title"
          className="text-center text-lg leading-4 font-bold text-foreground min-[400px]:text-xl"
        >
          {mobileTitle}
        </h1>
        <div>{children}</div>
        <SocialButtons variant="mobile" />
        <div className="text-center text-[15px] leading-[normal] text-muted-foreground">
          {mobileFooter}
        </div>
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
          <div className="pt-12">
            <DialogTitle className="sr-only">
              {mode === 'login' ? 'Entrar na Kurio' : 'Criar conta na Kurio'}
            </DialogTitle>
            <ModeSwitch mode={mode} redirect={redirect} />
            <DialogDescription className="mt-10 px-12 text-center text-[13px] leading-4 text-foreground">
              {description}
            </DialogDescription>
            <div className="px-20 pt-6">{children}</div>
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
    </>
  )
}
