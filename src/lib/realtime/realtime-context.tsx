import { createContext, useContext, useSyncExternalStore } from 'react'

import type { ConnectionStatus, RealtimeClient } from './realtime-client'

export const RealtimeContext = createContext<RealtimeClient | null>(null)

export function useRealtime() {
  const client = useContext(RealtimeContext)
  if (!client) throw new Error('useRealtime must be used inside <RealtimeContext.Provider>')
  return client
}

export function useConnectionStatus(): ConnectionStatus {
  const client = useRealtime()
  return useSyncExternalStore(client.onStatus, client.getStatus, client.getStatus)
}
