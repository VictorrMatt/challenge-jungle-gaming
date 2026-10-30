import { describe, expect, it } from 'vitest'

import { EventGate } from './event-gate'

const event = (eventId: string, version: number, id = 'emerald-ape-042') => ({
  eventId,
  version,
  resource: { type: 'nft', id },
})

describe('EventGate', () => {
  it('applies newer versions in order', () => {
    const gate = new EventGate()
    expect(gate.accept(event('a', 2))).toBe(true)
    expect(gate.accept(event('b', 3))).toBe(true)
  })

  it('drops duplicated deliveries of the same event', () => {
    const gate = new EventGate()
    expect(gate.accept(event('a', 2))).toBe(true)
    expect(gate.accept(event('a', 2))).toBe(false)
  })

  it('drops stale events that arrive after a newer one', () => {
    const gate = new EventGate()
    gate.accept(event('b', 5))
    expect(gate.accept(event('a', 4))).toBe(false)
  })

  it('drops events older than a version already seen through REST', () => {
    const gate = new EventGate()
    gate.observe('nft', 'emerald-ape-042', 7)
    expect(gate.accept(event('x', 6))).toBe(false)
    expect(gate.accept(event('y', 8))).toBe(true)
  })

  it('tracks versions per resource', () => {
    const gate = new EventGate()
    gate.accept(event('a', 9, 'one'))
    expect(gate.accept(event('b', 2, 'two'))).toBe(true)
  })

  it('forgets everything on reset (new session)', () => {
    const gate = new EventGate()
    gate.accept(event('a', 9))
    gate.reset()
    expect(gate.accept(event('a', 9))).toBe(true)
  })
})
