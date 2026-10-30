import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/api/errors'

import { ErrorState } from './error-state'

/** Route-level error boundary: resets the failed queries and re-runs the loader on retry. */
export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryReset = useQueryErrorResetBoundary()

  useEffect(() => {
    queryReset.reset()
  }, [queryReset])

  return (
    <div className="container-page py-16">
      <ErrorState
        title="Algo deu errado"
        description={errorMessage(error)}
        onRetry={() => {
          reset()
          void router.invalidate()
        }}
        action={
          <Button variant="outline" asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        }
      />
    </div>
  )
}
