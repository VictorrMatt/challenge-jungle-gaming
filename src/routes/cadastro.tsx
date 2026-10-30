import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cadastro')({
  component: () => <div className="container-page py-10">cadastro</div>,
})
