import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/entrar')({
  component: () => <div className="container-page py-10">entrar</div>,
})
