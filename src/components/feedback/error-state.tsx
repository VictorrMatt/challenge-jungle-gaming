import { RotateCw, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Inline error block with an optional retry action (announced to assistive tech). */
export function ErrorState({
  title = 'Não foi possível carregar',
  description,
  onRetry,
  retrying = false,
  className,
  action,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
  action?: ReactNode
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-md border border-border bg-card px-6 py-10 text-center',
        className,
      )}
    >
      <TriangleAlert className="size-8 text-destructive" aria-hidden="true" />
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="max-w-md text-muted-foreground">{description}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button onClick={onRetry} disabled={retrying}>
            <RotateCw className={cn(retrying && 'animate-spin')} aria-hidden="true" />
            {retrying ? 'Tentando novamente…' : 'Tentar novamente'}
          </Button>
        )}
        {action}
      </div>
    </div>
  )
}
