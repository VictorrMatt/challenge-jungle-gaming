/**
 * Transport readiness gate.
 *
 * The app renders as soon as its code is evaluated, while the transport it talks to may still be
 * starting (in the demo build, the MSW worker that serves REST and Socket.IO). Every REST request
 * and the realtime connection wait for this promise, so nothing is sent before the backend can
 * answer it and the first paint does not wait for the backend to boot.
 *
 * With a real backend nothing is held and the promise is already resolved.
 */
let ready: Promise<void> = Promise.resolve()

export function holdTransportUntil(startup: Promise<unknown>) {
  ready = startup.then(
    () => undefined,
    // A failed startup must not freeze the app: requests are released and fail on their own.
    () => undefined,
  )
}

export function whenTransportReady() {
  return ready
}
