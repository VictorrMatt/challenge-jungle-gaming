import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_private/pagamento')({
  component: () => <div className="container-page py-10">_private/pagamento</div>,
})
