import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}
    >
      {icon && <div className="text-highlight [&_svg]:size-10">{icon}</div>}
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="max-w-md text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}
