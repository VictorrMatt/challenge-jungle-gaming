import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import { App } from './App'

/**
 * The mock backend (MSW) is enabled by configuration and ships in the demo build.
 * It must be running before the first request, so rendering waits for it.
 */
async function enableMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false') return
  const { startMockServer } = await import('./mocks/browser')
  await startMockServer()
}

void enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
