import { createFileRoute, Link, redirect as redirectTo } from '@tanstack/react-router'

import { RegisterForm } from '@/features/auth/components/auth-forms'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { authModalLocation, isDesktopViewport } from '@/features/auth/auth-modal'
import { authSearchSchema } from '@/features/auth/redirect'

export const Route = createFileRoute('/cadastro')({
  validateSearch: authSearchSchema,
  // Desktop: open the modal over the page being resumed (or home) instead of a standalone page.
  beforeLoad: ({ search }) => {
    if (isDesktopViewport()) {
      throw redirectTo({
        ...authModalLocation('cadastro', search.redirect, search.redirect),
        replace: true,
      })
    }
  },
  head: () => ({ meta: [{ title: 'Criar conta — Kurio' }] }),
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect } = Route.useSearch()
  return (
    <AuthShell
      mobileTitle="Criar perfil de colecionador"
      mobileFooter={
        <>
          Já tem uma conta?{' '}
          <Link to="/entrar" search={{ redirect }} className="text-highlight hover:underline">
            Entre
          </Link>
        </>
      }
    >
      <RegisterForm redirect={redirect} />
    </AuthShell>
  )
}
