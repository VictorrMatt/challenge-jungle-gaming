import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nft/$nftId')({
  component: () => <div className="container-page py-10">nft.$nftId</div>,
})
