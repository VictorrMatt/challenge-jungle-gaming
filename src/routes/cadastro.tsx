import { createFileRoute, Link } from '@tanstack/react-router'

import { RegisterForm } from '@/features/auth/components/auth-forms'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { authSearchSchema } from '@/features/auth/redirect'

export const Route = createFileRoute('/cadastro')({
  validateSearch: authSearchSchema,
  head: () => ({ meta: [{ title: 'Criar conta — Kurio' }] }),
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect } = Route.useSearch()
  return (
    <AuthShell
      mode="register"
      redirect={redirect}
      description="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
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
