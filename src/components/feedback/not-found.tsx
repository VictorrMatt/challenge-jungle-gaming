import { Link } from '@tanstack/react-router'
import { Compass } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { EmptyState } from './empty-state'

export function NotFoundPage({
  title = 'Página não encontrada',
  description = 'O endereço acessado não existe ou foi removido.',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<Compass />}
        title={title}
        description={description}
        action={
          <Button asChild>
            <Link to="/">Explorar o mercado</Link>
          </Button>
        }
      />
    </div>
  )
}
