import { createFileRoute, Link, redirect as redirectTo } from '@tanstack/react-router'

import { AuthShell } from '@/features/auth/components/auth-shell'
import { LoginForm } from '@/features/auth/components/auth-forms'
import { authModalLocation, isDesktopViewport } from '@/features/auth/auth-modal'
import { authSearchSchema } from '@/features/auth/redirect'

export const Route = createFileRoute('/entrar')({
  validateSearch: authSearchSchema,
  // Desktop: open the modal over the page being resumed (or home) instead of a standalone page.
  beforeLoad: ({ search }) => {
    if (isDesktopViewport()) {
      throw redirectTo({
        ...authModalLocation('entrar', search.redirect, search.redirect),
        replace: true,
      })
    }
  },
  head: () => ({ meta: [{ title: 'Entrar — Kurio' }] }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  return (
    <AuthShell
      mobileTitle="Entrar"
      mobileFooter={
        <>
          Novo na Kurio?{' '}
          <Link to="/cadastro" search={{ redirect }} className="text-highlight hover:underline">
            Crie uma conta
          </Link>
        </>
      }
    >
      <LoginForm redirect={redirect} />
    </AuthShell>
  )
}
