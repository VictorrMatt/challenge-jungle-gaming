import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_private/pedido/$orderId')({
  component: () => <div className="container-page py-10">_private/pedido.$orderId</div>,
})
