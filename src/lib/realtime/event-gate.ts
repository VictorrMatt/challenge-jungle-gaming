/**
 * Decides whether a realtime event must be applied.
 *
 * - Duplicates (same `eventId`) are dropped, so effects are never re-applied.
 * - Stale events (version ≤ last applied version of that resource) are dropped, so an older
 *   event delivered late can never regress newer state.
 * - Versions observed through REST are fed in with `observe()`, so an event older than a fresh
 *   REST response is also ignored.
 */
export class EventGate {
  private readonly seen = new Set<string>()
  private readonly seenOrder: string[] = []
  private readonly versions = new Map<string, number>()
  private readonly capacity: number

  constructor(capacity = 500) {
    this.capacity = capacity
  }

  private key(type: string, id: string) {
    return `${type}:${id}`
  }

  /** Records a version known from REST without applying an event. */
  observe(type: string, id: string, version: number) {
    const key = this.key(type, id)
    if (version > (this.versions.get(key) ?? 0)) this.versions.set(key, version)
  }

  accept(event: { eventId: string; resource: { type: string; id: string }; version: number }) {
    if (this.seen.has(event.eventId)) return false
    this.seen.add(event.eventId)
    this.seenOrder.push(event.eventId)
    if (this.seenOrder.length > this.capacity) this.seen.delete(this.seenOrder.shift()!)

    const key = this.key(event.resource.type, event.resource.id)
    if (event.version <= (this.versions.get(key) ?? 0)) return false
    this.versions.set(key, event.version)
    return true
  }

  reset() {
    this.seen.clear()
    this.seenOrder.length = 0
    this.versions.clear()
  }
}
