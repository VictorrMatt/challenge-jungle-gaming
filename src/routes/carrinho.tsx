import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/carrinho')({
  component: () => <div className="container-page py-10">carrinho</div>,
})
