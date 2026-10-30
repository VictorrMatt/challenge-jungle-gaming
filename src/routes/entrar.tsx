import { createFileRoute, Link } from '@tanstack/react-router'

import { AuthShell } from '@/features/auth/components/auth-shell'
import { LoginForm } from '@/features/auth/components/auth-forms'
import { authSearchSchema } from '@/features/auth/redirect'

export const Route = createFileRoute('/entrar')({
  validateSearch: authSearchSchema,
  head: () => ({ meta: [{ title: 'Entrar — Kurio' }] }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  return (
    <AuthShell
      mode="login"
      redirect={redirect}
      description="Entre para gerenciar sua carteira, coleção e perfil de criador."
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
