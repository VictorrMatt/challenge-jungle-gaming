import type { EditionId } from '@/shared/contracts'

import { mutate, resetDatabase } from './db/store'
import {
  connectedClients,
  interruptConnections,
  replayLastEvent,
  sendStaleNftEvent,
} from './realtime/socket-server'
import {
  activeScenarioNames,
  isScenarioName,
  resetScenarioCounters,
  saveScenario,
  SCENARIOS,
  type ScenarioName,
} from './scenarios/scenarios'
import { setEditionAvailability, setNftPrice } from './services/catalog'
import { cancelPendingTimers, resumePendingOrders } from './services/checkout'

/**
 * Control surface of the simulated backend, exposed as `window.__kurioMock`.
 * Used by the scenario panel and by Playwright. It only changes server-side state and then lets
 * the normal REST/Socket.IO paths propagate the change — it never touches the app's state.
 */
export const mockControls = {
  scenarios: Object.fromEntries(
    Object.entries(SCENARIOS).map(([name, { description }]) => [name, description]),
  ),

  getScenario: () => activeScenarioNames(),

  setScenario(names: string[] | string) {
    const list = (Array.isArray(names) ? names : names.split(',')).filter(
      isScenarioName,
    ) as ScenarioName[]
    saveScenario(list)
    return activeScenarioNames()
  },

  /** Restores the deterministic seed (catalog, users, carts, orders) and scenario counters. */
  async reset() {
    cancelPendingTimers()
    await resetDatabase()
    resetScenarioCounters()
    resumePendingOrders()
  },

  setNftPrice: (nftId: string, price: string) => Boolean(setNftPrice(nftId, price)),

  setAvailability: (nftId: string, editionId: EditionId, available: number) =>
    Boolean(setEditionAvailability(nftId, editionId, available)),

  /** Ends every active session: the next private request answers 401 SESSION_EXPIRED. */
  expireSessions() {
    mutate((state) => {
      for (const session of Object.values(state.sessions))
        session.expiresAt = new Date(0).toISOString()
    })
  },

  /** Simulates the wallet extension dropping the connection. */
  disconnectWallets() {
    mutate((state) => {
      for (const session of Object.values(state.walletSessions)) session.status = 'disconnected'
    })
  },

  socket: {
    replayLastEvent,
    sendStaleNftEvent,
    interrupt: (ms = 0) => interruptConnections(ms),
    clients: connectedClients,
  },
}

export type MockControls = typeof mockControls

declare global {
  interface Window {
    __kurioMock?: MockControls
  }
}
