import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

/**
 * The mock backend (MSW) is enabled by configuration and ships in the demo build.
 * It must be running before the first request is made, so the first render waits for it.
 * The app code is downloaded and evaluated in parallel; it is safe because no request is sent
 * during module evaluation and socket.io-client (which captures the global WebSocket at import
 * time) is imported lazily by the realtime client, after the mocks are running.
 */
async function bootstrap() {
  const mocks =
    import.meta.env.VITE_ENABLE_MOCKS !== 'false'
      ? import('./mocks/browser').then(({ startMockServer }) => startMockServer())
      : Promise.resolve()
  const [{ App }] = await Promise.all([import('./App'), mocks])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  hideBootSplash()
}

/** Fades out the inline splash from index.html once the first frame of the app is painted. */
function hideBootSplash() {
  const splash = document.getElementById('boot-splash')
  if (!splash) return
  requestAnimationFrame(() => {
    splash.classList.add('is-done')
    window.setTimeout(() => splash.remove(), 400)
  })
}

void bootstrap()
