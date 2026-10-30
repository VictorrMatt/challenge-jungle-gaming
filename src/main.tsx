import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { holdTransportUntil } from '@/lib/api/transport'

import './index.css'

/**
 * Boot sequence.
 *
 * The mock backend (MSW) is enabled by configuration and ships in the demo build. It starts in
 * parallel with the app instead of in front of it: the first frame (shell, hero, skeletons) is
 * painted as soon as the app code is evaluated, while every REST request and the Socket.IO
 * connection wait on the transport gate until the mock server is running. Nothing is sent to the
 * network before MSW can intercept it.
 *
 * The initial query string is captured before the router normalizes the URL, so `?scenario=` and
 * `?panel=` still reach the mock server.
 */
async function bootstrap() {
  const initialSearch = location.search
  const mocks =
    import.meta.env.VITE_ENABLE_MOCKS !== 'false'
      ? import('./mocks/browser').then(({ startMockServer }) => startMockServer(initialSearch))
      : Promise.resolve()
  holdTransportUntil(mocks)

  // App evaluation binds the session to Axios (session-sync) before the revalidation below.
  const [{ App }, { revalidateSession }] = await Promise.all([
    import('./App'),
    import('./app/session-sync'),
  ])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  hideBootSplash()
  revalidateSession()
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
