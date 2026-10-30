import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

/**
 * The mock backend (MSW) is enabled by configuration and ships in the demo build.
 * It must be running before the first request AND before the app modules are evaluated:
 * engine.io-client captures the global `WebSocket` at import time, so the app is imported only
 * after MSW has patched it (otherwise Socket.IO would bypass the interception).
 */
async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { startMockServer } = await import('./mocks/browser')
    await startMockServer()
  }
  const { App } = await import('./App')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
