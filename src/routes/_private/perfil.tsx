import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_private/perfil')({
  component: () => <div className="container-page py-10">_private/perfil</div>,
})
