import { describe, expect, it } from 'vitest'

import { holdTransportUntil, whenTransportReady } from './transport'

describe('transport gate', () => {
  it('holds callers until the startup promise settles', async () => {
    let release!: () => void
    holdTransportUntil(new Promise<void>((resolve) => (release = resolve)))
    let passed = false
    const waiting = whenTransportReady().then(() => (passed = true))

    await Promise.resolve()
    expect(passed).toBe(false)
    release()
    await waiting
    expect(passed).toBe(true)
  })

  it('releases callers when the startup fails instead of freezing the app', async () => {
    holdTransportUntil(Promise.reject(new Error('worker failed')))
    await expect(whenTransportReady()).resolves.toBeUndefined()
  })
})
