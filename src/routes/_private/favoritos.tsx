import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_private/favoritos')({
  component: () => <div className="container-page py-10">_private/favoritos</div>,
})
