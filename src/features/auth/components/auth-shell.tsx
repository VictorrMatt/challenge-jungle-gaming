import type { ReactNode } from 'react'
import { toast } from 'sonner'

import { FacebookColorIcon, GoogleIcon } from '@/components/icons/brand-icons'
import { Logo } from '@/components/layout/logo'
import { cn } from '@/lib/utils'

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

/**
 * Full-screen sign-in/sign-up page (Figma mobile). On desktop the same forms open as a modal
 * over the current page instead — see `AuthModal`; the /entrar and /cadastro routes redirect
 * there before this renders.
 */
export function AuthShell({
  mobileTitle,
  mobileFooter,
  children,
}: {
  mobileTitle: string
  mobileFooter: ReactNode
  children: ReactNode
}) {
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
