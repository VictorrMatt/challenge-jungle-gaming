import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_private/pedido/$orderId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_private/pedido/$orderId"!</div>
}
