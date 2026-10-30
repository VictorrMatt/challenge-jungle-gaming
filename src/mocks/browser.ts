import { setupWorker } from 'msw/browser'

import { mockControls } from './controls'
import { initDatabase } from './db/store'
import { accountHandlers } from './handlers/account'
import { commerceHandlers } from './handlers/commerce'
import { socketHandler } from './realtime/socket-server'
import { resolveInitialScenario, saveScenario } from './scenarios/scenarios'
import { resumePendingOrders } from './services/checkout'

export const handlers = [...accountHandlers, ...commerceHandlers, socketHandler]

/**
 * Boots the simulated backend in the browser (dev, demo build and E2E):
 * restores the persisted database, selects the scenario and starts MSW
 * (REST through the Service Worker, Socket.IO through WebSocket interception).
 */
export async function startMockServer() {
  const panelParam = new URLSearchParams(location.search).get('panel')
  if (panelParam === 'off') sessionStorage.setItem('kurio:scenario-panel', 'off')
  if (panelParam === 'on') sessionStorage.removeItem('kurio:scenario-panel')

  await initDatabase()
  saveScenario(resolveInitialScenario(location.search, import.meta.env.VITE_MOCK_SCENARIO))
  resumePendingOrders()

  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: import.meta.env.PROD,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })

  window.__kurioMock = mockControls
  return worker
}
