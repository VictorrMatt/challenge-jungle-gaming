import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { applyFieldErrors } from '@/components/form/field-errors'
import { FormAlert, FormField, PasswordField } from '@/components/form/form-field'
import { Button } from '@/components/ui/button'
import { errorMessage, isApiClientError } from '@/lib/api/errors'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import {
  loginRequest,
  registerRequest,
  type LoginRequest,
  type RegisterRequest,
} from '@/shared/contracts'

import { useLogin, useRegister } from '../hooks'
import { safeRedirect } from '../redirect'
import { sessionStore, useSession } from '../session-store'

/** Where to go after authenticating: explicit redirect → interrupted location → home. */
function useResumeTarget(redirect?: string) {
  const session = useSession()
  const expiredFrom = session.status === 'anonymous' ? session.expiredFrom : null
  return safeRedirect(redirect ?? expiredFrom)
}

const mobileInput = 'h-[50px] rounded-[10px] bg-transparent px-4 text-sm leading-4'
const desktopInput = 'h-10 rounded-[5px] px-4 text-sm leading-4'

export function LoginForm({ redirect }: { redirect?: string }) {
  const login = useLogin()
  const navigate = useNavigate()
  const target = useResumeTarget(redirect)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequest),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    login.mutate(values, {
      onSuccess: (session) => {
        sessionStore.clearExpiredNotice()
        toast.success(`Bem-vindo de volta, ${session.user.displayName}!`)
        void navigate({ to: target, replace: true })
      },
      onError: (error) => {
        if (
          isApiClientError(error) &&
          applyFieldErrors(error.fieldErrors, form.setError, ['email', 'password'] as const)
        )
          return
        setFormError(errorMessage(error))
      },
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3" aria-busy={login.isPending}>
      <FormAlert message={formError} />
      <FormField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        error={errors.email?.message}
        inputClassName={isDesktop ? desktopInput : mobileInput}
        {...form.register('email')}
      />
      <PasswordField
        label="Senha"
        hideLabel
        autoComplete="current-password"
        placeholder="***********"
        error={errors.password?.message}
        inputClassName={isDesktop ? desktopInput : mobileInput}
        {...form.register('password')}
      />
      <p className="text-right">
        <button
          type="button"
          onClick={() =>
            toast.info('A recuperação de senha não está disponível nesta demonstração.', {
              id: 'forgot',
            })
          }
          className="text-sm leading-4 text-highlight hover:underline"
        >
          Esqueceu a senha?
        </button>
      </p>
      <Button
        type="submit"
        className={cn(
          'w-full text-base',
          isDesktop
            ? 'mt-3 h-[45px] rounded-[5px] leading-4'
            : 'mt-7 h-[60px] rounded-[10px] leading-4',
        )}
        disabled={login.isPending}
      >
        {login.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

export function RegisterForm({ redirect }: { redirect?: string }) {
  const register = useRegister()
  const navigate = useNavigate()
  const target = useResumeTarget(redirect)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequest),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
    mode: 'onBlur',
  })
  const { errors } = form.formState
  const inputClass = isDesktop
    ? desktopInput
    : cn(mobileInput, 'text-center placeholder:text-center first:text-left')

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    register.mutate(values, {
      onSuccess: (session) => {
        sessionStore.clearExpiredNotice()
        toast.success(`Conta criada! Bem-vindo à Kurio, ${session.user.displayName}.`)
        void navigate({ to: target, replace: true })
      },
      onError: (error) => {
        if (
          isApiClientError(error) &&
          applyFieldErrors(error.fieldErrors, form.setError, [
            'username',
            'email',
            'password',
            'confirmPassword',
          ] as const)
        ) {
          setFormError(
            error.is('EMAIL_TAKEN', 'USERNAME_TAKEN')
              ? 'Já existe uma conta com estes dados. Entre ou use outros dados.'
              : null,
          )
          return
        }
        setFormError(errorMessage(error))
      },
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3" aria-busy={register.isPending}>
      <FormAlert message={formError} />
      <FormField
        label="Nome de usuário"
        hideLabel
        autoComplete="username"
        placeholder="Nome de usuário"
        error={errors.username?.message}
        inputClassName={inputClass}
        {...form.register('username')}
      />
      <FormField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={errors.email?.message}
        inputClassName={isDesktop ? desktopInput : mobileInput}
        {...form.register('email')}
      />
      <PasswordField
        label="Senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Senha"
        hint="Mínimo de 8 caracteres, com letras e números."
        error={errors.password?.message}
        inputClassName={isDesktop ? desktopInput : mobileInput}
        {...form.register('password')}
      />
      <PasswordField
        label="Confirmar senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={errors.confirmPassword?.message}
        inputClassName={isDesktop ? desktopInput : mobileInput}
        {...form.register('confirmPassword')}
      />
      <Button
        type="submit"
        className={cn(
          'w-full text-base',
          isDesktop
            ? 'mt-3 h-[45px] rounded-[5px] leading-4'
            : 'mt-7 h-[60px] rounded-[10px] leading-4',
        )}
        disabled={register.isPending}
      >
        {register.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {register.isPending ? 'Criando…' : isDesktop ? 'Criar conta' : 'Criar perfil'}
      </Button>
    </form>
  )
}
