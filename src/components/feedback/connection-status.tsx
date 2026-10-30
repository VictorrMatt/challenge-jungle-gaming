import { WifiOff } from 'lucide-react'

import { useConnectionStatus } from '@/lib/realtime/realtime-context'

/** Visible + announced banner while the realtime connection is down. */
export function ConnectionStatus() {
  const status = useConnectionStatus()
  if (status !== 'reconnecting' && status !== 'offline') return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-warning px-4 py-1.5 text-sm font-bold text-primary-foreground"
    >
      <WifiOff className="size-4" aria-hidden="true" />
      {status === 'offline'
        ? 'Você está offline. Atualizações em tempo real pausadas.'
        : 'Reconectando às atualizações em tempo real…'}
    </div>
  )
}
